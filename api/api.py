import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import joblib

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)


# define a root `/` endpoint
@app.get("/")
def index():
    return {"ok": True}


@app.get("/predict")
def predict(country, governorate, location_type, demand_type, protest_tactic,
            protestor_violence, combined_sizes):

    # Formatting the input of the variables to the model
    prediction_input = pd.DataFrame({
        'country': [str(country)],
        'governorate': [str(governorate)],
        'locationtypeend': [str(location_type)],
        'demandtypeone': [str(demand_type)],
        'tacticprimary': [str(protest_tactic)],
        'violence': [str(protestor_violence)],
        'combined_sizes': [int(combined_sizes)]
    })

    load_path_model = "final_RF_model"
    load_path_pre_processor = "pipeline"

    model = joblib.load(load_path_model)
    pre_processor = joblib.load(load_path_pre_processor)

    processed_prediction_input = pre_processor.transform(prediction_input)

    prediction = model.predict_proba(processed_prediction_input)

    return {
        'model0': f'{prediction[0]}',
        'model1': prediction[1],
        'model2': prediction[2],
        'model3': prediction[3],
        'model4': prediction[4],
        'model5': prediction[5],
        'model6': prediction[6],
    }
