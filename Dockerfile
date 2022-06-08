FROM python:3.8.6-buster

COPY api /api
COPY api/final_RF_model /final_RF_model
COPY requirements.txt /requirements.txt

RUN pip install --upgrade pip
RUN pip install -r requirements.txt

CMD uvicorn api.api:app --host 0.0.0.0 --port $PORT
