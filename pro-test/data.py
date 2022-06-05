import string
import pandas as pd 

'''datasets local path'''
leb_dataset_path = 'data/Leb_1_drop_non_impact_params.csv'
iraq_dataset_path = 'data/iraq_1_drop_non_impact_params.csv'
egypt_dataset_path = 'data/egypt_1_drop_non_impact_params.csv'

def get_data():
    '''returns 3 DataFrames (leb - iraq - eygpt)'''
    '''added new column with the country name'''
    leb_df = pd.read_csv(leb_dataset_path,index_col=0)
    leb_df['country'] = 'Lebanon'
    iraq_df = pd.read_csv(iraq_dataset_path,index_col=0)
    iraq_df['country'] = 'Iraq'
    egypt_df = pd.read_csv(egypt_dataset_path,index_col=0)
    egypt_df['country'] = 'Egypt'

    return leb_df, iraq_df, egypt_df

def clean_data(df):
    ''' returns cleand Dataframe '''
    ''' dropping non important columns '''
    list_of_columns = None

    if df.country[0] == 'Lebanon':
        list_of_columns = ['ongoing','location','timeofprotest','demandother','modified_demands','Future Movement','Federation of Popular Leagues and Committes','Islamic Charitable Projects (Al Ahbash)','Arab Liberation Party','Akkar Popular Assembly','Union of Muslim Ulama',
                           'Ahmad Al Assir','Islamic Group','Islamic Labour Front','Islamic Unification Movement','Sunni Other','Hezbollah','Amal','Shia Other','Progressive Socialist Movement','Lebanese Democratic Party','Lebanese Unification Movement',
                           'Druze Other','Free Patriotic Movement',"Phalanges (Kata'eb)",'Lebanese Forces','Al Marada','National Liberal Party','Qornet Shehwan Gathering','Christian Other','Democratic Renewal Party Tajaddod',
                            'National Block','Arab Democratic Party','Alawite Youth Movement','Tashnag (Armenian)','Henchag (Armenian)','Ramgavar (Armenian)','Kurdish Parties','Communist Party','Communist Action  Organization','Democratic Left','Socialist Forum','Lebanese Democratic Youth Union',
                            'Leftist Other',"People's Movement","Ba'ath Party",'Syrian Social Nationalist Party','Al Murabitoun','Popular Nasserite Organization',"Workers' League",'Palestinian Factions','Sabaa Party','Beirut Madinati','You_Stink','Badna Nhasseb','activists',
                            'labourers/workers','General Confederation of Lebanese Workers','Union Coordination Movement','Unions','Peasants/ Farmers','NGO/CSOs','Youth/Students','LGBT/Q+','Womens Groups','Residents','Refugees',
                            'Tenants','Landlords','militia or party','eventcancelled','cancelreason','nameofevent','endate','gpslatstart', 'gpslongstart', 'locationtypestart','slogans','organizer','orgtypesecond','sector', 'participantother', 'sector', 'industryfirst', 'industrysecond','campaign']
        return df.drop(columns=list_of_columns)

    elif df.country[0] == 'Iraq':
        list_of_columns = ['ongoing','location','govresign','antiUS','antiIran','antiSoleimani','proUS','proIran','proSoleimani','unions/syndicates','islamists','kurds','christians','tribes',
            'NGOs/CSOs','womensgroups','refugees','shootinginair','ISISrepress','nameofevent','endate','gpslatstart', 'gpslongstart', 'locationtypestart','slogans','organizer','orgtypesecond','youth/students', 'laborers/workers', 'peasants/farmers',
            'demandother','party members', 'activists/movts', 'gov workers', 'business','residents', 'soldiers', 'police', 'participantother', 'sector','industryfirst', 'industrysecond','campaign','response']
        return df.drop(columns=list_of_columns)

    elif df.country[0] == 'Egypt':
        list_of_columns = ['nameofevent','endate','tahrir','ittihadeyya','parliament','rabaa','minofdef','sizecategory','antiMB','antiMorsi','antiSCAF','Morsifall','milintervene','orgMB','orgNSF','orgTamarod','ultras','salafis','copts','MB','feloul','secularopp',
                    'Tamarodcampaign','organizer', 'youth/students', 'laborers/workers', 'peasants/farmers','party members', 'activists/movts','demandother','disengcampas',
                    'gov workers', 'business','residents', 'soldiers', 'police', 'participantother','campaign']

        df = df.rename({'gpslat':'gpslatend', 'gpslong':'gpslongend', 'locationtype':'locationtypeend',
                      'orgtype':'orgtypefirst', 'repressiontype':'repression'}, axis=1)
        return df.drop(columns=list_of_columns)

def combine_dfs(df1,df2,df3):
    '''combine the 3 Dataframes'''
    full_df = pd.concat([df1, df2, df3],ignore_index=True)

    '''clean the size columns and combine them'''
    full_df['sizeestimate'] = full_df['sizeestimate'].str.replace('[{}]'.format(string.punctuation), '')
    full_df['sizeestimate'] = full_df['sizeestimate'].fillna(-99)
    full_df['sizeestimate'] = full_df['sizeestimate'].astype('float64')
    full_df['sizeexact'] = full_df['sizeexact'].fillna(0)
    full_df['combined_sizes'] = full_df['sizeexact'] + full_df['sizeestimate']
    full_df.drop(columns=['sizeexact','sizeestimate'], inplace=True)
    return full_df
