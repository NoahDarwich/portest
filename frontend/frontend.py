import streamlit as st
import requests

import numpy as np
import pandas as pd

st.markdown("""# Pro-Test
## Predictive Modelling for a Safer Forum of Dissent
Please enter your expected or live protest conditions below to allow the model to predict the expectation of outcomes"""
            )

Amal = int(st.checkbox('Amal is present'))
Hezbollah = int(st.checkbox('Hezbollah is present'))
Progressive_Socialist_Movement = int(
    st.checkbox('Progressive Socialist Movement is present'))
Number_of_Participants = st.number_input('Number of Participants',
                                         value=1,
                                         step=1,
                                         min_value=1)

# Amal = 1
# Hezbollah = 1
# Progressive_Socialist_Movement = 1
# Number_of_Participants = 500000

url = 'https://pro-test-v6c2rihg2a-ew.a.run.app/predict'

parameters = dict(Amal_present=Amal,
                  Hezbollah_present=Hezbollah,
                  ProgressiveSocialistMovement=Progressive_Socialist_Movement,
                  number_of_participants=Number_of_Participants)

response = requests.get(url, params=parameters).json()

response
