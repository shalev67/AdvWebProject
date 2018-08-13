# import expenses.utils as utils
import utils
from sklearn import preprocessing
import numpy as np
import pandas as pd
import copy
from sklearn.neighbors import KNeighborsRegressor
import math


mongo_train_cols = {'income': 1, 'maritalStatus': 1, 'gender': 1, 'kids': 1, 'zone': 1, 'birthDate': 1, '_id': 1}


# Reading data from the db about the users
def read_data(users_collection, user_id, month, year):
    # get the expenses grouped to categories
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
            # group by user_id and category, sum each category's expenses and get the necessary data on the user
            "$group": {
                "_id": {"user_id": "$_id", "category": "$transactions.category"},
                "transactions": {"$sum": "$transactions.price"},
                "income": {"$first": "$income"},
                "maritalStatus": {"$first": "$maritalStatus"},
                "gender": {"$first": "$gender"},
                "zone": {"$first": "$zone"},
                "kids": {"$first": "$kids"},
                "birthDate": {"$first": "$birthDate"}
            }
        }
    ]

    users_outcome_per_category_dic = list(users_collection.aggregate(get_transactions_total_by_month))

    # Get only the data on all of the users (beside the expenses)
    users_train_data = []
    for curr in users_outcome_per_category_dic:
        if not utils.contains(users_train_data, lambda x: x['_id'] == curr['_id']['user_id']):
            users_train_data.append({'_id': curr['_id']['user_id'], 'income': curr['income'], 'maritalStatus': curr['maritalStatus'],
                         'gender': curr['gender'], 'zone': curr['zone'], 'kids': curr['kids'], 'birthDate': curr['birthDate']})

    # Get only the expenses of the users
    users_outcome_per_category_dic = [{'_id': curr['_id'], 'transactions': curr['transactions']} for curr in users_outcome_per_category_dic]

    # Get the data on the current logged user (beside the expenses)
    logged_user_data = list(users_collection.find({'_id': user_id}, mongo_train_cols))

    return users_train_data, users_outcome_per_category_dic, logged_user_data


def get_nearest_neighbors_to_user(users_collection, user_id, month, year, category=None):
    train_data, users_outcome_per_category_dic, current_user_data = read_data(users_collection, user_id, month, year)

    if category:
        return get_prediction_by_category(train_data, users_outcome_per_category_dic, current_user_data, category, only_indices=True)

    train_data_object_ids = []
    train_res = []
    for user_data in train_data:
        # total_expense = 0
        # enter the total transactions of the user for the current category, if there is none enter 0
        transactions_of_user = [curr["transactions"] for curr in users_outcome_per_category_dic if curr['_id']['user_id'] == user_data['_id']]
        total_expense = sum(transactions_of_user)
        train_res.append(total_expense)

    # Delete id column (the transform function of the non numeric values doesn't need it)
    for data in train_data:
        train_data_id = data.pop('_id')
        train_data_object_ids.append(train_data_id)
    current_user_data[0].pop('_id')

    train_data, current_user_data = transform_string_categories_to_numeric_values(train_data, current_user_data)
    k = int(math.sqrt(len(train_data) + len(current_user_data)))
    knn_regressor = get_nearest_neighbors_regressor(k, train_data, train_res)

    distances, indices = knn_regressor.kneighbors(current_user_data)
    ids = [x for i, x in enumerate(train_data_object_ids) if i in indices[0]]
    return ids, indices[0]
    # indices = get_prediction_by_category(train_data, users_outcome_per_category_dic, current_user_data, category, only_distances=True)
    # return indices


# region //////////////////////////////////////////////////////////////////////////// Encoding categorical features ////////////////////////////////////////////////////////////////////////////
# Transforms every string type data in the training data to numeric data using OneHotEncoder
def transform_string_categories_to_numeric_values(train_data, current_user_data):
    # get the object (string) type data from both the current user and the rest of the users
    categorical_matrix = pd.DataFrame(train_data).select_dtypes(include=[object])
    user_categorical_matrix = pd.DataFrame(current_user_data).select_dtypes(include=[object])

    # Perform the transformation to numerical data
    le = preprocessing.LabelEncoder()
    label_encoded_matrix = categorical_matrix.apply(le.fit_transform)
    user_label_encoded_matrix = user_categorical_matrix.apply(le.fit_transform)
    enc = preprocessing.OneHotEncoder(n_values=[4, 2, 3])
    one_hot_labels = enc.fit_transform(label_encoded_matrix).toarray()
    user_one_hot_labels = enc.fit_transform(user_label_encoded_matrix).toarray()

    return add_numerical_categories(train_data, current_user_data, one_hot_labels, user_one_hot_labels)


# Add all of the numerical categories to the training data
def add_numerical_categories(train_data, current_user_data, one_hot_labels, user_one_hot_labels):
    # Income column
    income_column = np.array([user['income'] for user in train_data])
    matrix_with_income = np.append(one_hot_labels, income_column[:, None], axis=1)
    user_income_column = np.array([user['income'] for user in current_user_data])
    user_matrix_with_income = np.append(user_one_hot_labels, user_income_column[:, None], axis=1)

    # Birth date column
    birth_date_column = np.array([user['birthDate'].year for user in train_data])
    matrix_with_birth_date = np.append(matrix_with_income, birth_date_column[:, None], axis=1)
    user_birth_date_column = np.array([user['birthDate'].year for user in current_user_data])
    user_matrix_with_birth_date = np.append(user_matrix_with_income, user_birth_date_column[:, None], axis=1)

    # Number of kids column
    kids_column = np.array([user['kids'] for user in train_data])
    total_matrix = np.append(matrix_with_birth_date, kids_column[:, None], axis=1)
    user_kids_column = np.array([user['kids'] for user in current_user_data])
    total_user_matrix = np.append(user_matrix_with_birth_date, user_kids_column[:, None], axis=1)

    return total_matrix, total_user_matrix
# endregion //////////////////////////////////////////////////////////////////////////// Encoding categorical features ////////////////////////////////////////////////////////////////////////////


# Get the expected expense prediction of all the categories
def get_prediction(users_collection, user_id, month, year):
    categories = list(users_collection.distinct("transactions.category"))
    train_data, users_outcome_per_category_dic, current_user_data = read_data(users_collection, user_id, month, year)
    response = []
    for category in categories:
        # Make a copy of the data so when we delete the _id field it won't change also in here
        current_user_data_copy = copy.deepcopy(current_user_data)
        train_data_copy = copy.deepcopy(train_data)

        if not users_outcome_per_category_dic:
            response.append(build_response_dictionary(month, year, category, 0))
        else:
            # Get the prediction of this category
            prediction_of_category = get_prediction_by_category(train_data_copy, users_outcome_per_category_dic, current_user_data_copy, category)
            response.append(build_response_dictionary(month, year, category, prediction_of_category[0]))
    return response


# Get the expected expense prediction of a specific category
def get_prediction_by_category(train_data, users_outcome_per_category_dic, current_user_data, category, only_indices=False):
    train_res = []
    for user_data in train_data:
        # enter the total transactions of the user for the current category, if there is none enter 0
        category_transactions_of_user = [curr["transactions"] for curr in users_outcome_per_category_dic if curr['_id']['user_id'] == user_data['_id'] and curr['_id']['category'] == category]
        train_res.append(category_transactions_of_user[0] if category_transactions_of_user else 0)

    # Delete id column (the transform function of the non numeric values doesn't need it)
    for data in train_data:
        data.pop('_id')
    current_user_data[0].pop('_id')

    train_data, current_user_data = transform_string_categories_to_numeric_values(train_data, current_user_data)
    k = int(math.sqrt(len(train_data) + len(current_user_data)))
    knn_regressor = get_nearest_neighbors_regressor(k, train_data, train_res)
    # neigh = KNeighborsRegressor(n_neighbors=k)
    # neigh.fit(train_data, train_res)
    if only_indices:
        distances, indices = knn_regressor.kneighbors(current_user_data)
        return indices[0]

    return knn_regressor.predict(current_user_data)


def get_nearest_neighbors_regressor(k, train_data, train_res):
    knn_regressor = KNeighborsRegressor(n_neighbors=k)
    knn_regressor.fit(train_data, train_res)
    return knn_regressor

def build_response_dictionary(month, year, category, prediction_of_category):
    return {"_id": {"month": month, "year": year, "category": category}, "totalPrice": prediction_of_category}