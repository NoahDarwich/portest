import streamlit as st
import requests

import numpy as np
import pandas as pd
import plotly.express as px

st.markdown("""# Pro-Test
## Predictive Modelling for a Safer Forum of Dissent
Please enter your expected or live protest conditions below to allow the model to predict the expectation of outcomes"""
            )

file_path = 'pro-test/data/full_df.csv'
df = pd.read_csv(file_path, index_col=0)

country_lst = df['country'].drop_duplicates()
governorate_lst = df['governorate'].drop_duplicates().dropna()
location_type_lst = df['locationtypeend'].drop_duplicates().dropna()
demand_lst = df['demandtypeone'].drop_duplicates().dropna()
tactic_lst = df['tacticprimary'].drop_duplicates().dropna()
violence_lst = df['violence'].drop_duplicates().dropna()

with st.sidebar:

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


repression_predictions = response['predict0'].replace("[[",
                                                      "").replace("]]",
                                                                  "").split()
no_nown_coercion = float(repression_predictions[3])
physical_harassment_probability = float(repression_predictions[5])
arrests_and_detentions_probability = float(repression_predictions[0])
injuries_inflicted_probability = float(repression_predictions[2])
deaths_inflicted_probability = float(repression_predictions[1])
security_forces_present_at_event_probability = float(repression_predictions[6])
party_or_militias_present_at_event_probability = float(repression_predictions[4])


teargas_probability = list(response['predict1'].values())[0]
rubber_bullets_probability = list(response['predict2'].values())[0]
live_ammo_probability = list(response['predict3'].values())[0]
sticks_probability = list(response['predict4'].values())[0]
protest_surrounded_probability = list(response['predict5'].values())[0]
area_cleared_probability = list(response['predict6'].values())[0]


rep_lst = [no_nown_coercion,arrests_and_detentions_probability,physical_harassment_probability,
                  injuries_inflicted_probability,deaths_inflicted_probability,
                  security_forces_present_at_event_probability,
                  party_or_militias_present_at_event_probability]

methods_lst = {'teargas':teargas_probability,'rubber_bullets':rubber_bullets_probability,
               'live_ammo':live_ammo_probability,
                'sticks':sticks_probability,
                'protest_surrounded':protest_surrounded_probability,
                'area_cleared':area_cleared_probability}

# st.markdown(rep_lst)

def plot_map(df):
    df['violence_heat'] = np.where(df['repression']!= 'No known coercion, no security presence', 1, 0)
    df.dropna(subset=['gpslatend','gpslongend'])
    fig_new = px.density_mapbox(df,
                            lat = 'gpslatend',
                            lon = 'gpslongend',
                            opacity = 0.6,
                            z = 'violence_heat',
                            hover_data=['demandtypetwo','repression','tacticprimary'],
                            radius = 10,
                            center = dict(lat = 30.5852, lon = 36.2384),
                            zoom = 4,
                            mapbox_style = 'carto-positron',
                            title = "Demonstraions density",
                            color_continuous_scale='YlOrRd'
                       )
    return fig_new.update_layout(height=800, width=1000)
map_fig = plot_map(df)
st.plotly_chart(map_fig)


def rep_pred_dict(probas):

    label_vs_encode = {0:'No known coercion',
                   2:'Physical harassment',
                   1:'Arrests and detentions',
                   3:'Injuries inflicted',
                   4:'Deaths inflicted',
                   5:'Security forces present at event',
                    6:'Party or Militias present at event'}

    rep_lst = probas
    cat_prob = {}
    for index, value in enumerate(rep_lst):
        rep_type = label_vs_encode[index]
        cat_prob[rep_type] = value

    propa_dict = dict(sorted(cat_prob.items(), key=lambda item: item[1]))
    return propa_dict


rep_type_dict = rep_pred_dict(rep_lst)


def first_lst_plot(dct):
    propa_df = pd.DataFrame(dct, index=[0]).T
    propa_df = propa_df.reset_index()
    propa_df.columns = ['rep_type','percent']
    propa_df = propa_df.reindex([2, 6, 3, 4, 0, 5, 1])
    fig = px.bar(propa_df,
                 x=propa_df['rep_type'],
                 y= propa_df['percent'],
                barmode='group',
                title='probabilites of repression methods',
                color= propa_df['percent'],
                color_continuous_scale='OrRd',
                template='ggplot2'
                )

    return fig.update_layout(height=800, width=1000)

rep_type_fig = first_lst_plot(rep_type_dict)
st.plotly_chart(rep_type_fig)




def propa_vs_labels(probas):
    ''' pass a the lists of arrays '''
    ''' it returns dict with the probability value and the label as key'''

    propa_dict = {'teargas': None,'rubberbullets': None,
                  'liveammo': None,'sticks': None,
                  'surround': None,'cleararea': None}
    keys_lst = [x for x in propa_dict.keys()]
    count = 0
    for lst in range(1,len(probas)):
        propa_dict[keys_lst[count]] = probas[lst][1]
        count += 1
    return propa_dict


# rep_methods_dict = propa_vs_labels(methods_lst)

def bar_plot(dct):
    propa_df = pd.DataFrame(dct, index=[0]).T
    propa_df.index.name ='method'
    propa_df = propa_df.reset_index()
    propa_df.columns = ['method','percent']
    fig = px.bar(propa_df,
                 x=propa_df['method'],
                 y= propa_df['percent'],
                barmode='group',
                title='probabilites of repression methods',
                color= propa_df['percent'],
                color_continuous_scale='OrRd',
                template='ggplot2'
                )

    return fig.update_layout(height=800, width=1000)

fig = bar_plot(methods_lst)
st.plotly_chart(fig)
# repression_predictions = response
# st.markdown(repression_predictions)









# physical_harassment_probability = round(
#     float(repression_predictions[5]), 2)
# arrests_and_detentions_probability = round(
#     float(repression_predictions[0]), 2)
# injuries_inflicted_probability = round(
#     float(repression_predictions[2]), 2)
# deaths_inflicted_probability = round(float(repression_predictions[1]), 2)
# security_forces_present_at_event_probability = round(
#     float(repression_predictions[6]), 2)
# party_or_militias_present_at_event_probability = round(
#     float(repression_predictions[4]), 2)

# teargas_probability = round(list(response['predict1'].values())[0], 2)
# rubber_bullets_probability = round(
#     list(response['predict2'].values())[0], 2)
# live_ammo_probability = round(list(response['predict3'].values())[0], 2)
# sticks_probability = round(list(response['predict4'].values())[0], 2)
# protest_surrounded_probability = round(
#     list(response['predict5'].values())[0] , 2)
# area_cleared_probability = round(
#     list(response['predict6'].values())[0], 2)

# st.markdown("""## Model Prediction Probabilities""")
# st.markdown("""### Repression Type""")
# f"Deaths Inflicted: {deaths_inflicted_probability}%"
# f"Injuries Inflicted: {injuries_inflicted_probability}%"
# f"Physical Harassment of Protesters: {physical_harassment_probability}%"
# f"Arrests and Dentention of Protesters: {arrests_and_detentions_probability}%"
# f"Militias Present: {party_or_militias_present_at_event_probability}%"
# f"Security Forces Present: {security_forces_present_at_event_probability}%"
# f"No Known Coercion of Protesters: {no_known_coercion_probability}%"

# st.markdown("""### Repression Means""")
# f"Live Ammo: {live_ammo_probability}%"
# f"Rubber Bullets: {rubber_bullets_probability}%"
# f"Teargas: {teargas_probability}%"
# f"Batons/Sticks: {sticks_probability}%"
# f"Area Cleared of Protesters: {area_cleared_probability}%"
# f"Protesters Surrounded by Repression: {protest_surrounded_probability}%"
