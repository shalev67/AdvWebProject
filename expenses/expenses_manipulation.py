from flask import Flask ,jsonify, request
# TODO: Replace with another datetime lib
from pandas._libs.lib import datetime

# from expenses import decision_tree, expenses_knn
import decision_tree, expenses_knn
from pymongo import MongoClient
from bson import ObjectId

from datetime import datetime, date, timedelta
import os

debug = True
port = 3001
mongo_port = 27017
client = MongoClient(port=mongo_port)
db = client.test
users_collection = db.users

path, filename = os.path.split(os.path.realpath(__file__))
json_folder_path = path

categories_dict = {'הכל': None,'דלק': 'fuel', 'מכולת/סופר': 'supermarket', 'מסעדות/קפה': 'restaurants', 'הלבשה': 'clothing'}


def write_decision_tree_to_file(user_id, month, year, hebrew_category, json_file_path):
    # If there is no category selected build a tree of all categories
    if not hebrew_category:
        result = decision_tree.build_decision_tree_table(users_collection, user_id, month, year)
    else:
        result = decision_tree.build_decision_tree_table_for_category(users_collection, user_id, hebrew_category, month, year)

    with open(json_file_path, 'w', encoding="utf-16") as outfile:
        outfile.write(str(result).replace("\"", "").replace("'", "\""))


app = Flask(__name__)


@app.route("/user/<user_id>")
def get_expected_expense(user_id):
    today = datetime.today()
    month = request.args.get('month', default= today.month)
    year = request.args.get('year', default= today.year)
    prediction_by_category = expenses_knn.get_prediction(users_collection, ObjectId(user_id), int(month), int(year))
    return jsonify(prediction_by_category)


@app.route("/decisionTree/<user_id>")
def get_decision_tree(user_id):
    last_month_date = date.today().replace(day=1) - timedelta(days=1)
    month = int(request.args.get('month', default=last_month_date.month))
    year = int(request.args.get('year', default=last_month_date.year))
    hebrew_category = request.args.get('category', default=None)
    if not hebrew_category:
        my_decision_tree = decision_tree.build_decision_tree_table(users_collection, user_id, month, year)
    else:
        my_decision_tree = decision_tree.build_decision_tree_table_for_category(users_collection, user_id, hebrew_category, month, year)

    return str(my_decision_tree).replace("\"", "").replace("'", "\"")

@app.route("/getNearestNeighbors/<user_id>")
def get_nearest_neighbors(user_id):
    last_month_date = date.today().replace(day=1) - timedelta(days=1)
    month = int(request.args.get('month', default=last_month_date.month))
    year = int(request.args.get('year', default=last_month_date.year))
    ids = expenses_knn.get_nearest_neighbors_to_user(users_collection, ObjectId(user_id), int(month), int(year))
    return str(ids)

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,OPTIONS')
    return response


if __name__ == '__main__':
    app.run(debug=debug, port=port, host='0.0.0.0', threaded=True)
