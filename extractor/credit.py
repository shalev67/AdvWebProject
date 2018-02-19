import textract
from itertools import tee

import os
from flask import Flask, request, make_response
from werkzeug.utils import secure_filename

UPLOAD_FOLDER = '/tmp/'
ALLOWED_EXTENSIONS = {'pdf'}

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/', methods=['GET', 'POST'])
def upload_file():
    if request.method == 'POST':
        # check if the post request has the file part
        if 'data' not in request.files:
            # bad request
            return make_response('Bad request', 400)
        file = request.files['data']
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            extract_transaction_from_pdf(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            return "OK!"
    else:
        return 'Hello World!'


def pairwise(iterable):
    (a, b) = tee(iterable)
    next(b, None)
    return zip(a, b)


def remove_rtl(text):
    text = text.replace('\u202a', '')
    text = text.replace('\u202b', '')
    text = text.replace('\u202c', '')
    text = text.replace('í', 'ם')
    text = text.replace('ï', 'ן')
    text = text.replace('ó', 'ף')
    text = text.replace('ê', 'ך')
    text = text.replace('õ', 'ץ')
    return text


def extract_credit_card_number(lines):
    return lines[0][2:]


def is_timestamp(date_text):
    if len(date_text) == 8:
        numbers = date_text.split('/')
        if len(numbers) == 3:
            number1 = numbers[0]
            number2 = numbers[1]
            number3 = numbers[2]
            is_number1 = len(number1) == 2 and number1.isdigit()
            is_number2 = len(number2) == 2 and number2.isdigit()
            is_number3 = len(number3) == 2 and number3.isdigit()
            if all([is_number1, is_number2, is_number3]):
                return True
    return False


class Transaction:
    date = None
    to = None
    iska = None


class Data:
    credit_card_last_digits = None
    name = None
    address = None
    transactions = None


def extract_transaction_from_pdf(file_path):
    text = textract.process(file_path, 'UTF-8')
    data = Data()

    decode_text = text.decode()
    decode_text = remove_rtl(decode_text)

    decode_text = decode_text.split('\n')
    decode_text = list([value for value in decode_text if value != 'ה.קבע'])
    decode_text = list([value for value in decode_text if value != ''])
    data.credit_card_last_digits = extract_credit_card_number(decode_text)
    dates = list()
    businesses = list()

    for a, b in pairwise(decode_text):
        if is_timestamp(b):
            dates.append(b)
            businesses.append(a)
    dates_len = len(dates)
    index = decode_text.index('בש"ח')
    atms = decode_text.count('משיכת מזומנים')
    prices = list(decode_text[index + 1: index + atms * 2: 2]) + list(decode_text[index + atms * 2 + 1: index + 1 + atms * 2 + dates_len - atms])
    index = decode_text.index('סכו םעסקה')
    start = index
    categories = list()
    while len(categories) < dates_len or index - start < dates_len:
        index += 1
        temp = decode_text[index]
        temp = temp.replace('.', '')
        if not temp.isdigit():
            categories.append(decode_text[index])
    transactions = {"transactions": []}
    for date, business, price, category in zip(dates, businesses, prices, categories):
        transactions['transactions'].append({
            'date': date,
            'buissness': business,
            'price': price,
            'category': category
        })
    print(transactions)


if __name__ == '__main__':
    app.run(port=3000)
