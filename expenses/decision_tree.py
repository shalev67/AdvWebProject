from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import roc_auc_score
import statistics
import re
# import expenses.expenses_knn as knn
import expenses_knn as knn

hebrew_month_names = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר']
target_names = ['האנשים הבזבזניים ביותר', 'האנשים הרווחיים ביותר']


# Building an array of nodes and links that will be read by the go library in the client and present the decision tree,
# aaccording to the decision tree result and the businesses info
def decision_tree_structure(users_collection, clf, features, node_index=0, result=[], links=[]):
    node = {}
    # if there is no links it's the root node
    if not links:
        node["key"] = node_index + 1
        # If there is an english character in the name of the business than it will be in a new line for readability purpose
        node["name"] = check_for_english_characters(features[clf.tree_.feature[node_index]])
        node["category"] = get_business_category(users_collection, features[clf.tree_.feature[node_index]])
        result.append(node)
        left_index = clf.tree_.children_left[node_index]
        right_index = clf.tree_.children_right[node_index]
        # Set the links coming out from the current node
        links.append({"from": node_index + 1, "to": left_index + 1, "text": "לא קונים"})
        links.append({"from": node_index + 1, "to": right_index + 1, "text": "קונים"})
        # Call the function recursively for the right node and the left node
        decision_tree_structure(users_collection, clf, features, right_index, result, links)
        decision_tree_structure(users_collection, clf, features, left_index, result, links)
        # After the tree is complete build the structure that the go library in the client will be able to present
        final_structure = {"class": "go.GraphLinksModel", "nodeDataArray": result, "linkDataArray": links}

        return final_structure
    else:
        node["key"] = node_index + 1
        # Zip between the name of the business and the correct hebrew sentence that should appear beneath it
        count_labels = zip(clf.tree_.value[node_index, 0], target_names)
        node["counter"] = "\n".join(('{} מתוך {}'.format(int(count), label)
                                     for count, label in count_labels))

        # In case that it's not a leaf
        if clf.tree_.children_left[node_index] != -1:
            node["name"] = check_for_english_characters(features[clf.tree_.feature[node_index]])
            node["category"] = get_business_category(users_collection, features[clf.tree_.feature[node_index]])
            left_index = clf.tree_.children_left[node_index]
            right_index = clf.tree_.children_right[node_index]
            links.append({"from": node_index + 1, "to": left_index + 1, "text": "לא קונים"})
            links.append({"from": node_index + 1, "to": right_index + 1, "text": "קונים"})
            decision_tree_structure(users_collection, clf, features, right_index, result, links)
            decision_tree_structure(users_collection, clf, features, left_index, result, links)
        result.append(node)

    return node


# Return the category of the business
def get_business_category(users_collection, business_name):
    categories_possibilities = list(users_collection.aggregate([
        {"$unwind": "$transactions"},
        {"$match": {"transactions.business": business_name}},
        {"$project": {"category": "$transactions.category"}}
    ]))
    return categories_possibilities[0]["category"]


# Checks for english character in a string
# If it finds english characters, makes a new line before it for readability purpose
def check_for_english_characters(business_name):
    new_string = business_name
    english_characters = re.findall('[a-zA-Z]', business_name)
    if english_characters:
        english_character_index = business_name.index(english_characters[0])
        new_string = business_name[:(english_character_index - 1)] + '\n' + business_name[(english_character_index - 1):]

    return new_string


# Building a decision tree
# In the decision tree will be isplayed the businesses that make the difference between the users that are more profitable to those who are more spenders
# The users that will be checked are the ones who are the closest to the current user, and will be diveded into two groups of profitable and spenders with median according to there income/expenses ratio
def build_decision_tree_table(users_collection, user_id, month, year):
    users_businesses = list(users_collection.aggregate([
        {"$unwind": "$transactions"},
        {
            "$redact": {
                "$cond": {
                    "if": {
                        "$and": [
                            {"$eq": [{"$month": "$transactions.date"}, month]},
                            {"$eq": [{"$year": "$transactions.date"}, year]},

                        ]
                    },
                    "then": "$$KEEP",
                    "else": "$$PRUNE"
                }
            }
        },
        {"$group": {
            "_id": "$_id",
            "income": {'$first': '$income'},
            "outcome": {'$sum': "$transactions.price"},
            "businesses": {"$push": "$transactions.business"},

        }},
        {'$project': {
            "_id": '$_id',
            "businesses": "$businesses",
            "balance": {"$subtract": ['$income', '$outcome']}
        }
    }
    ]))


    # indices_nearest_neighbors = knn.get_nearest_neighbors(users_collection, user_id, month, year, hebrew_category)

    # users_businesses = [user_info for i, user_info in enumerate(users_businesses) if i in indices_nearest_neighbors]

    if users_businesses:
        balances = [x['balance'] for x in users_businesses]
        median = statistics.median(balances)
        all_businesses = []
        # Get a list of all the businesses the users visited
        for x in users_businesses:
            for y in x['businesses']:
                if y not in all_businesses:
                    all_businesses.append(y)

        users_use_businesses = []
        users_above_median = []
        for x in users_businesses:
            current_user_businesses = []
            # Create a binary table of 1 in case this user visited this business or 0 if not
            for y in all_businesses:
                if y in x['businesses']:
                    current_user_businesses.append(1)
                else:
                    current_user_businesses.append(0)
            # the 'result' of the tree will be if the user's balance is above the median (1) or below the median (0)
            if x['balance'] >= median:
                users_above_median.append(1)
            else:
                users_above_median.append(0)

            users_use_businesses.append(current_user_businesses)

        clf = DecisionTreeClassifier()
        clf.fit(users_use_businesses, users_above_median)

        roc_score = compute_roc_auc_score(clf, users_use_businesses, users_above_median)

        # Check that the decision tree is reliable and if not don't show it
        if roc_score > 0.7:
            tree = decision_tree_structure(users_collection, clf, all_businesses, result=[], links=[])
            result = {"tree": tree, "month": hebrew_month_names[month - 1], "year": year}
            return result
        else:
            # TODO: Check this
            return None


# Building a decision tree for a specific category
# In the decision tree will be isplayed the businesses that make the difference between the users that are more profitable to those who are more spenders
# The users that will be checked are the ones who are the closest to the current user, and will be diveded into two groups of profitable and spenders with median according to there income/expenses ratio
def build_decision_tree_table_for_category(users_collection, user_id, hebrew_category, month, year):
    users_businesses = list(users_collection.aggregate([
        {"$unwind": "$transactions"},
        {
            "$redact": {
                "$cond": {
                    "if": {
                        "$and": [
                            {"$eq": [{"$month": "$transactions.date"}, month]},
                            {"$eq": [{"$year": "$transactions.date"}, year]},
                        ]
                    },
                    "then": "$$KEEP",
                    "else": "$$PRUNE"
                }
            }
        },
        {"$group": {
            "_id": "$_id",
            "income": {'$first': '$income'},
            "outcome": {'$sum': "$transactions.price"},
            "businesses": {
                "$push": {"$cond": {
                    "if": {
                        "$eq": ["$transactions.category", hebrew_category]
                    },
                    "then": "$transactions.business",
                    "else": ""
                }},
            }
        }},
        {'$project': {
            "_id": '$_id',
            "businesses": "$businesses",
            "balance": {"$subtract": ['$income', '$outcome']}
            }
        }
    ]))

    # Get only the nearest users to the current user according to their basic info and incomes/expenses
    indices_nearest_neighbors = knn.get_nearest_neighbors(users_collection, user_id, month, year, hebrew_category)
    users_businesses = [user_info for i, user_info in enumerate(users_businesses) if i in indices_nearest_neighbors]

    if users_businesses:
        balances = [x['balance'] for x in users_businesses]
        median = statistics.median(balances)
        all_businesses = []
        # Get a list of all the businesses the users visited
        for user in users_businesses:
            for business in user['businesses']:
                if business and business not in all_businesses:
                    all_businesses.append(business)
        if all_businesses:
            users_use_businesses = []
            users_above_median = []
            for user in users_businesses:
                current_user_businesses = []
                # Create a binary table of 1 in case this user visited this business or 0 if not
                for business in all_businesses:
                    if business in user['businesses']:
                        current_user_businesses.append(1)
                    else:
                        current_user_businesses.append(0)
                # the 'result' of the tree will be if the user's balance is above the median (1) or below the median (0)
                if user['balance'] >= median:
                    users_above_median.append(1)
                else:
                    users_above_median.append(0)

                users_use_businesses.append(current_user_businesses)

            clf = DecisionTreeClassifier()
            clf.fit(users_use_businesses, users_above_median)

            roc_score = compute_roc_auc_score(clf, users_use_businesses, users_above_median)

            # Check that the decision tree is reliable and if not don't show it
            if roc_score > 0.7:
                tree = decision_tree_structure(users_collection, clf, all_businesses, result=[], links=[])
                result = {"tree": tree, "month": hebrew_month_names[month - 1], "year": year }
                return result
            else:
                # TODO: Check this
                return None


def read_decision_tree_from_file(json_file_path):
    try:
        with open(json_file_path, 'r', encoding='utf-16') as outfile:
            decision_tree = outfile.read()
            return decision_tree
    except:
        # TODO: Return exception
        return None
        # return jsonify("")


def compute_roc_auc_score(decision_tree_classifier, train_data, train_results):
    y_scores = []
    for index, current_train_data in enumerate(train_data):
        probabilities = decision_tree_classifier.predict_proba([current_train_data])[0]
        y_scores.append(probabilities[train_results[index]])
    return roc_auc_score(train_results, y_scores)