from flask import Flask, jsonify
from sklearn.neighbors import KNeighborsRegressor
import pandas as pd
from pymongo import MongoClient
from sklearn import preprocessing
import numpy as np
import math
from bson import ObjectId

debug = True
port = 666
mongo_port = 27017
client = MongoClient(port=mongo_port)
db = client.test

# region Mongo columns
mongo_train_cols = {'income': 1, 'maritalStatus': 1, 'gender': 1, 'kids': 1, 'zone': 1, 'birthDate': 1, '_id': 0}
user_id_col = '_id'
users_collection = db.users
# endregion


# region Reading data from the db about the users
def read_data(user_id):
    # get the properties of the users that are not the current user
    users_train_data = list(users_collection.find({user_id_col: {"$ne": user_id}}, mongo_train_cols))

    # get the expenses
    users_outcome_pipeline = [{
                                  "$project": {
                                      "transactions": {
                                          "$cond": {
                                              "if": {"$eq": [{"$size": "$transactions"}, 0]},
                                              "then": 0,
                                              "else": {"$sum": "$transactions.price"}
                                          }
                                      },
                                      "_id": "$_id"
                                  }
                              },
                              {
                                  "$unwind": "$transactions"
                              }
                              ]
    users_outcome_dictionary = list(users_collection.aggregate(users_outcome_pipeline))
    train_res_data = [user['transactions'] for user in users_outcome_dictionary if user[user_id_col] != user_id]

    logged_user_data = list(users_collection.find({user_id_col: user_id}, mongo_train_cols))

    return users_train_data, train_res_data, logged_user_data
# endregion


# region Encoding categorical features
def transform_string_categories_to_numberic_values(train_data, current_user_data):
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


# Setting the KNN Regressor (for linear regression)
def get_prediction(user_id):
    train_data, train_res, current_user_data = read_data(user_id)
    train_data, current_user_data = transform_string_categories_to_numberic_values(train_data, current_user_data)
    k = int(math.sqrt(len(train_data) + len(current_user_data)))
    neigh = KNeighborsRegressor(n_neighbors=k)
    neigh.fit(train_data, train_res)

    return neigh.predict(current_user_data)


app = Flask(__name__)


@app.route("/user/<user_id>")
def get_expected_expense(user_id):
    return_value = get_prediction(ObjectId(user_id))
    return jsonify(return_value[0])


@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,OPTIONS')
    return response


if __name__ == '__main__':
    app.run(debug=debug, port=port, host='0.0.0.0')
