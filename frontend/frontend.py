import streamlit as st
import requests

import numpy as np
import pandas as pd

st.markdown("""# Pro-Test
## Predictive Modelling for a Safer Forum of Dissent
Please enter your expected or live protest conditions below to allow the model to predict the expectation of outcomes"""
            )

file_path = 'pro-test/data/full_df.csv'
df = pd.read_csv(file_path, index_col=0)

country_lst = df['country'].drop_duplicates()
governorate_lst = df['governorate'].drop_duplicates()
location_type_lst = df['locationtypeend'].drop_duplicates()
demand_lst = df['demandtypeone'].drop_duplicates()
tactic_lst = df['tacticprimary'].drop_duplicates()
violence_lst = df['violence'].drop_duplicates()

Country = str(st.selectbox('Country', country_lst))
Governorate = str(st.selectbox('Governorate', governorate_lst))
Location_Type = str(st.selectbox('Location Type', location_type_lst))
Demand_Type = str(st.selectbox('Type of Demand from Protester', demand_lst))
Tactic_Primary = str(st.selectbox('Primary Protest Tactic', tactic_lst))
Violence_Protesters = str(
    st.selectbox('Level of Violence of Protesters', violence_lst))
Number_of_Participants = st.number_input('Number of Participants',
                                         value=3,
                                         step=1,
                                         min_value=3)

url = 'https://pro-test-v02-v6c2rihg2a-ew.a.run.app/predict'

parameters = dict(country=Country,
                  governorate=Governorate,
                  location_type=Location_Type,
                  demand_type=Demand_Type,
                  protest_tactic=Tactic_Primary,
                  protestor_violence=Violence_Protesters,
                  combined_sizes=Number_of_Participants)

response = requests.get(url, params=parameters).json()

st.markdown("""## Inputted Parameters""")
parameters

repression_predictions = response['predict0'].replace("[[",
                                                      "").replace("]]",
                                                                  "").split()

no_known_coercion_probability = round(
    float(repression_predictions[3]) * 100, 2)
physical_harassment_probability = round(
    float(repression_predictions[5]) * 100, 2)
arrests_and_detentions_probability = round(
    float(repression_predictions[0]) * 100, 2)
injuries_inflicted_probability = round(
    float(repression_predictions[2]) * 100, 2)
deaths_inflicted_probability = round(float(repression_predictions[1]) * 100, 2)
security_forces_present_at_event_probability = round(
    float(repression_predictions[6]) * 100, 2)
party_or_militias_present_at_event_probability = round(
    float(repression_predictions[4]) * 100, 2)

teargas_probability = round(list(response['predict1'].values())[0] * 100, 2)
rubber_bullets_probability = round(
    list(response['predict2'].values())[0] * 100, 2)
live_ammo_probability = round(list(response['predict3'].values())[0] * 100, 2)
sticks_probability = round(list(response['predict4'].values())[0] * 100, 2)
protest_surrounded_probability = round(
    list(response['predict5'].values())[0] * 100, 2)
area_cleared_probability = round(
    list(response['predict6'].values())[0] * 100, 2)

st.markdown("""## Model Prediction Probabilities""")
st.markdown("""### Repression Type""")
f"Deaths Inflicted: {deaths_inflicted_probability}%"
f"Injuries Inflicted: {injuries_inflicted_probability}%"
f"Physical Harassment of Protesters: {physical_harassment_probability}%"
f"Arrests and Dentention of Protesters: {arrests_and_detentions_probability}%"
f"Militias Present: {party_or_militias_present_at_event_probability}%"
f"Security Forces Present: {security_forces_present_at_event_probability}%"
f"No Known Coercion of Protesters: {no_known_coercion_probability}%"

st.markdown("""### Repression Means""")
f"Live Ammo: {live_ammo_probability}%"
f"Rubber Bullets: {rubber_bullets_probability}%"
f"Teargas: {teargas_probability}%"
f"Batons/Sticks: {sticks_probability}%"
f"Area Cleared of Protesters: {area_cleared_probability}%"
f"Protesters Surrounded by Repression: {protest_surrounded_probability}%"
