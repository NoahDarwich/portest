import joblib
import pandas as pd

def get_prediction(**kwargs):

    model = joblib.load('final_RF_model.joblib')
    pipeline = joblib.load('pipeline.joblib')


    # parameters = dict(country= kwargs['country'],
    #               governorate= kwargs['Governorate'],
    #               location_type= kwargs['Location_Type'],
    #               demand_type= kwargs['Demand_Type'],
    #               protest_tactic= kwargs['Tactic_Primary'],
    #               protestor_violence= kwargs['Violence_Protesters'],
    #               combined_sizes=kwargs['Number_of_Participants'])

    X = pd.DataFrame({'country':kwargs['country'],
                      'governorate':kwargs['Governorate'],
                      'locationtypeend':kwargs['Location_Type'],
                           'demandtypeone':kwargs['Demand_Type'],
                           'tacticprimary':kwargs['Tactic_Primary'],
                           'violence':kwargs['Violence_Protesters'],
                          'combined_sizes':kwargs['Number_of_Participants']})
    X_transformed = pipeline.transform(X)

    return model.predict_proba(X_transformed)
