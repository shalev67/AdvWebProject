import textract
from itertools import tee
import base64
import bson
import uuid
import os
from flask import Flask, request, jsonify
import datetime
from pymongo import MongoClient
import string
import json

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
    text = text.replace('', 'נ')
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


def is_price(price):
    allowed = string.digits + '.' + ',' + '-'
    return all(c in allowed for c in price)


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


def extract_transaction_from_isracard_pdf(lines, user_id):
    data = Data()
    remove_list = [
        'ה.קבע',
        '',
        'לא הוצג',
        'סכו םהחיוב',
        'בש"ח',
        '}',
        'ש םבית עסק',
        'תאריך',
        'עסקה',
        'כרטיס',
        'בעסקה',
        'ענף',
        'ש.אלחוט'
    ]
    categories_list = [
        'ביטוח',
        'שרות רפואי',
        'נופש ותיור',
        'בתי ספר',
        'פנאי/ספורט',
        'שירותי רכב',
        'דלק',
        'מכולת/סופר',
        'רהיטים',
        'מסעדות/קפה',
        'מוצרי חשמל',
        "קניה אינט'",
        "תש' רשויות",
        'פארמה',
        'כלי בית',
        'משתלות',
        'הלבשה',
        'מעדניות',
        'תרבות',
        'שונות',
        "תש' רשויות",
        'ספרי/םדיסק',
        'אבזרי אפנה',
        'טוטו/פיס',
        'הנעלה',
        'צעצועים',
        'עיתו/ןדפוס'
    ]
    lines = list([value for value in lines if value not in remove_list])
    start_index = lines.index('עסקות שחויבו  /זוכו  -בארץ')
    end_index = lines.index('מסגרת הכרטיס ותנאי האשראי')
    lines = lines[start_index + 1:end_index]
    categories = list([value for value in lines if value in categories_list])
    try:
        remove_index_start = lines.index('פירוט נוסף')
        remove_index_end = lines.index('עסקות שחויבו  /זוכו  -בארץ')
    except ValueError:
        remove_index_start = None
        remove_index_end = None
    if remove_index_start and remove_index_end:
        lines = lines[:remove_index_start] + lines[remove_index_end + 1:]
    dates = [date for date in lines if is_timestamp(date)]
    temp = list()
    prices = list()
    for line in lines:
        if is_price(line):
            temp.append(line)
        else:
            if len(temp) and len(prices) < len(dates):
                if len(temp) > len(dates) * 2:
                    temp = temp[:len(dates) * 2]
                if len(temp) % 2 != 0:
                    temp = temp[:-1]
                if int(len(temp)/2) + len(prices) > len(dates):
                    temp = temp[:-2]
                prices += temp[int(len(temp)/2):]
            temp = list()
    lines = list([value for value in lines if value not in categories_list])
    lines = list([value for value in lines if not is_price(value)])
    lines = list([value for value in lines if not is_timestamp(value)])
    lines = list([value for value in lines if value != 'עסקות שחויבו  /זוכו  -בארץ'])
    lines = list([value for value in lines if value != 'סכו םעסקה'])
    lines = list([value for value in lines if 'סה"כ חיוב לתאר' not in value])
    businesses = lines[:len(dates) + 1]
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
        transaction['price'] = transaction['price'].replace(',', '')
        transaction['price'] = int(float(transaction['price']))
        transaction['date'] = datetime.datetime.strptime(date, '%d/%m/%Y')
    add_transaction_to_user(transactions=transactions, user_id=user_id)


def extract_transaction_from_pdf(file_path, user_id):
    # TODO add error message and handler for textract.exceptions.ShellError exception
    text = textract.process(file_path, 'UTF-8')
    decode_text = text.decode()
    decode_text = remove_rtl(decode_text)
    lines = decode_text.split('\n')
    extract_transaction_from_isracard_pdf(lines, user_id)

if __name__ == '__main__':
    app.run(port=3000, host='0.0.0.0')
