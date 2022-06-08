import streamlit as st
import requests

import numpy as np
import pandas as pd

st.markdown("""# Pro-Test
## Predictive Modelling for a Safer Forum of Dissent
Please enter your expected or live protest conditions below to allow the model to predict the expectation of outcomes"""
            )

Country = str(st.selectbox('Country', ('Egypt', 'Iraq', 'Lebanon')))
Governorate = str(st.selectbox('Governorate', ('''put list here''')))
Location_Type = str(st.selectbox('Location Type', ('''put list here''')))
Demand_Type = str(
    st.selectbox('Type of Demand from Protester', ('''put list here''')))
Tactic_Primary = str(
    st.selectbox('Primary Protest Tactic', ('''put list here''')))
Violence_Protesters = str(
    st.selectbox('Level of Violence of Protesters', ('''put list here''')))
Number_of_Participants = st.number_input('Number of Participants',
                                         value=1,
                                         step=1,
                                         min_value=1)

url = 'https://pro-test-v6c2rihg2a-ew.a.run.app/predict'

parameters = dict(Input_Country=Country,
                  Input_Governorate=Governorate,
                  Input_Location_Type=Location_Type,
                  Input_Demand_Type=Demand_Type,
                  Input_Tactic_Primary=Tactic_Primary,
                  Input_Violence_Protesters=Violence_Protesters,
                  Input_Number_of_Participants=Number_of_Participants)

response = requests.get(url, params=parameters).json()

response
