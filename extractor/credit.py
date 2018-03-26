import textract
from itertools import tee
import base64
import bson
import uuid
import os
from flask import Flask, request, jsonify
import datetime
from pymongo import MongoClient

UPLOAD_FOLDER = '/tmp/'
ALLOWED_EXTENSIONS = {'pdf'}

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
client = MongoClient('mongodb://localhost:27017/')

users_collection = client.test.users


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.after_request
def cors_enabled(response):
    response.headers['Access-Control-Allow-Origin'] = 'http://localhost:5000'
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    return response


@app.route('/', methods=['GET', 'POST'])
def upload_file():
    is_request_post = request.method == 'POST'
    is_user_cookie_string = type(request.cookies.get('currentUserId')) is str
    is_user_len_ok = type(request.cookies.get('currentUserId')) is str
    if is_request_post and is_user_cookie_string and is_user_len_ok:
        user_id = request.cookies.get('currentUserId')[3:-3]
        file_stream = request.form['file']
        file_name = uuid.uuid4().hex + '.pdf'
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], file_name)
        with open(file_path, 'wb') as file:
            file.write(base64.b64decode(file_stream[28:]))

        extract_transaction_from_pdf(file_path, user_id)
        return jsonify({"message": "User id : %s transaction was updated" % user_id})
    else:
        # TODO remove GET
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


def add_transaction_to_user(transactions, user_id):
    current_transactions = users_collection.find_one({'_id': bson.ObjectId(user_id)})['transactions']
    for transaction in current_transactions:
        transaction.pop('_id', None)

    transactions['transactions'] = [transaction for transaction in
                                    transactions['transactions'] if transaction not in current_transactions]
    for transaction in transactions['transactions']:
        transaction['_id'] = bson.objectid.ObjectId()
    users_collection.update_one(
        {'_id': bson.ObjectId(user_id)},
        {'$push': {'transactions': {'$each': transactions['transactions']}}}
    )


def extract_transaction_from_pdf(file_path, user_id):
    # TODO add error message and handler for textract.exceptions.ShellError exception
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
            'business': business,
            'price': price,
            'category': category
        })
    for transaction in transactions['transactions']:
        date = transaction['date']
        date = date.split('/')
        date[2] = '20' + date[2]
        date = '/'.join(date)
        transaction['price'] = int(float(transaction['price']))
        transaction['date'] = datetime.datetime.strptime(date, '%d/%m/%Y')
    add_transaction_to_user(transactions=transactions, user_id=user_id)


if __name__ == '__main__':
    app.run(port=3000, host='0.0.0.0')
