'''Data cleaning and futures engineering'''
import data

import pandas as pd
from sklearn.impute import SimpleImputer

leb_df, iraq_df, egypt_df = data.get_data()

clean_leb = data.clean_data(leb_df)
clean_iraq = data.clean_data(iraq_df)
clean_egypt = data.clean_data(egypt_df)

def size_imputer(df):
    '''Compining sizeexact and sizeestimate in one column'''
    '''Impute the -99 values (unknown size) to average'''
    mean_size_imputer = SimpleImputer(missing_values=-99,strategy="mean")
    mean_size_imputer.fit_transform(df['combined_sizes'])

    pass
