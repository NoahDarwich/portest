from fastapi import FastAPI
import joblib

app = FastAPI()


# define a root `/` endpoint
@app.get("/")
def index():
    return {"ok": True}


@app.get("/predict")
def predict(Amal_present, Hezbollah_present, ProgressiveSocialistMovement,
            number_of_participants):

    # Formatting the input of the variables to the model
    Amal = int(Amal_present)
    Hezbollah = int(Hezbollah_present)
    ProgressiveSocialistMovement_bool = int(ProgressiveSocialistMovement)
    size_of_event = float(number_of_participants)

    prediction_string = [[
        Amal, Hezbollah, ProgressiveSocialistMovement_bool, size_of_event
    ]]

    # Define target values
    targets = [
        'Army_present_at_event', 'Arrests__detentions', 'Deaths_inflicted',
        'Injuries_inflicted', 'No_known_coercion_no_security_presence',
        'Party_Militias_Baltagia_present_at_event', 'Physical_harassment',
        'Security_forces_present_at_event'
    ]

    model_dict = {}

    for i in targets:
        load_path = 'model_logistic_regression_' + i
        model_dict[i] = str(
            joblib.load(load_path).predict(prediction_string)[0])

    return model_dict
