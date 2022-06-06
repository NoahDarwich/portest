'''Data cleaning and futures engineering'''
import data

from sklearn.impute import SimpleImputer
from sklearn.preprocessing import OneHotEncoder, OrdinalEncoder


leb_df, iraq_df, egypt_df = data.get_data()

clean_leb = data.clean_data(leb_df)
clean_iraq = data.clean_data(iraq_df)
clean_egypt = data.clean_data(egypt_df)

full_df = data.combine_dfs(clean_leb, clean_iraq, clean_egypt)

def size_imputer(df):
    '''Impute the -99 values (unknown size) with mean as strategy'''

    mean_size_imputer = SimpleImputer(missing_values=-99,strategy="mean")
    df['combined_sizes'] = mean_size_imputer.fit_transform(df[['combined_sizes']])

    return df

def cat_columns_encoder(X,y):
    '''return the transformed categorical X and y'''
    ohe = OneHotEncoder()
    oen = OrdinalEncoder()
    X = ohe.fit_transform(X)
    y = oen.fit_transform(y)
    return X, y
