from flask import Flask, jsonify, request
from pandas._libs.lib import datetime
from sklearn.neighbors import KNeighborsRegressor
import pandas as pd
from pymongo import MongoClient
from sklearn import preprocessing
import numpy as np
import math
from bson import ObjectId
import copy
from datetime import datetime

debug = True
port = 666
mongo_port = 27017
client = MongoClient(port=mongo_port)
db = client.test

# region Mongo columns
mongo_train_cols = {'income': 1, 'maritalStatus': 1, 'gender': 1, 'kids': 1, 'zone': 1, 'birthDate': 1, '_id': 1}
user_id_col = '_id'
users_collection = db.users

categories = ['שונות', 'מסעדות/קפה', 'דלק', 'קניה אינט"', 'מכולת/סופר', 'תקשורת', 'מחשבים']
# endregion


# region Reading data from the db about the users
def read_data(user_id, month, year):
    # get the properties of the users that are not the current user
    users_train_data = list(users_collection.find({user_id_col: {"$ne": user_id}}, mongo_train_cols).sort(user_id_col, 1))

    # get the expenses
    get_transactions_total_by_month = [
        {
            "$unwind": {"path": "$transactions"}
        },
        {
            "$redact": {
                "$cond": {
                    "if": {
                        # if this is not the current user, remove the transactions that are not from the requested month and year
                        "$and": [
                            {"$ne": ["$_id", user_id]},
                            {"$eq": [{"$month": "$transactions.date"}, month]},
                            {"$eq": [{"$year": "$transactions.date"}, year]},

                        ]
                    },
                    "then": "$$KEEP",
                    "else": "$$PRUNE"
                }
            }
        },
        {
            # group by user_id and category and sum each category's expenses
            "$group": {
                "_id": {"user_id": "$_id", "category": "$transactions.category"},
                "transactions": {"$sum": "$transactions.price"},
                "date": {"$first": "$transactions.date"}
            }
        }
    ]

    users_outcome_per_category_dic = list(users_collection.aggregate(get_transactions_total_by_month))
    users_outcome_per_category_dic.sort(key= lambda curr: curr["_id"]["user_id"])

    logged_user_data = list(users_collection.find({user_id_col: user_id}, mongo_train_cols))

    return users_train_data, users_outcome_per_category_dic, logged_user_data
# endregion


# region Encoding categorical features
def transform_string_categories_to_numeric_values(train_data, current_user_data):
    categorical_matrix = pd.DataFrame(train_data).select_dtypes(include=[object])
    user_categorical_matrix = pd.DataFrame(current_user_data).select_dtypes(include=[object])
    le = preprocessing.LabelEncoder()
    label_encoded_matrix = categorical_matrix.apply(le.fit_transform)
    user_label_encoded_matrix = user_categorical_matrix.apply(le.fit_transform)

    enc = preprocessing.OneHotEncoder(n_values=[4, 2, 3])
    one_hot_labels = enc.fit_transform(label_encoded_matrix).toarray()
    user_one_hot_labels = enc.fit_transform(user_label_encoded_matrix).toarray()

    return add_numerical_categories(train_data, current_user_data, one_hot_labels, user_one_hot_labels)


def add_numerical_categories(train_data, current_user_data, one_hot_labels, user_one_hot_labels):
    # numeric_categorial_matrix = pd.DataFrame(train_data).select_dtypes(include=[np.number])
    # user_numeric_categorical_matrix = pd.DataFrame(current_user_data).select_dtypes(include=[np.number])

    income_column = np.array([user['income'] for user in train_data])
    matrix_with_income = np.append(one_hot_labels, income_column[:, None], axis=1)
    user_income_column = np.array([user['income'] for user in current_user_data])
    user_matrix_with_income = np.append(user_one_hot_labels, user_income_column[:, None], axis=1)

    birth_date_column = np.array([user['birthDate'].year for user in train_data])
    matrix_with_birth_date = np.append(matrix_with_income, birth_date_column[:, None], axis=1)
    user_birth_date_column = np.array([user['birthDate'].year for user in current_user_data])
    user_matrix_with_birth_date = np.append(user_matrix_with_income, user_birth_date_column[:, None], axis=1)

    kids_column = np.array([user['kids'] for user in train_data])
    total_matrix = np.append(matrix_with_birth_date, kids_column[:, None], axis=1)
    user_kids_column = np.array([user['kids'] for user in current_user_data])
    total_user_matrix = np.append(user_matrix_with_birth_date, user_kids_column[:, None], axis=1)

    return total_matrix, total_user_matrix
# endregion


def get_prediction(user_id, month, year):
    train_data, users_outcome_per_category_dic, current_user_data = read_data(user_id, month, year)
    response = []
    for category in categories:
        current_user_data_copy = copy.deepcopy(current_user_data)
        train_data_copy = copy.deepcopy(train_data)
        prediction_of_category = get_prediction_by_category(train_data_copy, users_outcome_per_category_dic, current_user_data_copy, category)
        response.append({"_id": {"month": month, "year": year, "category": category}, "totalPrice": prediction_of_category[0]})
    return response

def get_prediction_by_category(train_data, users_outcome_per_category_dic, current_user_data, category):
    # train_data, train_res, current_user_data = read_data_by_month(user_id, month, year)
    train_res = []
    for user_data in train_data:
        # enter the total transactions of the user for the current category, if there is none enter 0
        category_transactions_of_user = [curr["transactions"] for curr in users_outcome_per_category_dic if curr[user_id_col]['user_id'] == user_data[user_id_col] and curr[user_id_col]['category'] == category]
        train_res.append(category_transactions_of_user[0] if category_transactions_of_user else 0)

    # Delete id column is (the transform function of the non numeric values doesn't need it)
    for data in train_data:
        data.pop('_id')
    current_user_data[0].pop('_id')

    train_data, current_user_data = transform_string_categories_to_numeric_values(train_data, current_user_data)
    k = int(math.sqrt(len(train_data) + len(current_user_data)))
    neigh = KNeighborsRegressor(n_neighbors=k)
    neigh.fit(train_data, train_res)

    return neigh.predict(current_user_data)


app = Flask(__name__)


@app.route("/user/<user_id>")
def get_expected_expense(user_id):
    today = datetime.today()
    month = request.args.get('month', default= today.month)
    year = request.args.get('year', default= today.year)
    prediction_by_category = get_prediction(ObjectId(user_id), int(month), int(year))
    return jsonify(prediction_by_category)


@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,OPTIONS')
    return response


if __name__ == '__main__':
    app.run(debug=debug, port=port, host='0.0.0.0')
