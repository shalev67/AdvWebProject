def contains(my_list, my_filter):
    for x in my_list:
        if my_filter(x):
            return True
    return False
