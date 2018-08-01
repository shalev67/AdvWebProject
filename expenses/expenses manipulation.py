from flask import Flask ,jsonify, request
from pandas._libs.lib import datetime

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
    hebrew_category = request.args.get('category', default="הכל")
    category = categories_dict[hebrew_category]
    if not category:
        json_file_path = json_folder_path + "/all.json"
    else:
        json_file_path = json_folder_path + "/" + category + ".json"
    if not os.path.isfile(json_file_path):
        write_decision_tree_to_file(user_id, month, year, hebrew_category, json_file_path)
    else:
        # Read month and year from file and then choose if to build or not
        server_file_date = datetime.fromtimestamp(os.path.getmtime(json_file_path))
        if debug and category:
            if last_month_date.month != server_file_date or last_month_date.year != server_file_date.year:
                write_decision_tree_to_file(user_id, month, year, hebrew_category, json_file_path)
    # Read the tree from the file, if there is no file return empty tree
    try:
        with open(json_file_path, 'r', encoding='utf-16') as outfile:
            my_decision_tree = outfile.read()
    except:
        return jsonify("")
    return my_decision_tree

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,OPTIONS')
    return response


# first_id = users_collection.find_one()['_id']
# get_nearest_neighbors(id, 6, 2018, "שונות")
# decision_tree.build_decision_tree_table_for_category(users_collection, first_id, "שונות", 6, 2018)
if __name__ == '__main__':
    app.run(debug=debug, port=port, host='0.0.0.0', threaded=True)
