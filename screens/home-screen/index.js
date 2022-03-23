// @flow
import React from "react";
import {
    View,
    TouchableOpacity,
    StyleSheet
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { defaultStyles } from "../../styles/default-styles";
import { getUsersTeams } from "../../libs/team-helpers";
import User from "../../models/user";
import { removeNulls } from "../../libs/remove-nulls";
import { daysUntilCurrentGreenUpDay } from "../../libs/green-up-day-calucators";
import * as R from "ramda";
import { selectTeam } from "../../action-creators/team-action-creators";
import * as constants from "../../styles/constants";
import {
    Text,
    Card,
    Divider,
    GridRow,
    Image,
    ImageBackground,
    ListView,
    Subtitle,
    Tile
} from "@shoutem/ui";

const styles = StyleSheet.create(defaultStyles);

const homeTitle = R.cond(
    [
        [(days: number): boolean => days > 1, (days: number): string => `${ days } days until Green Up Day`],
        [(days: number): boolean => days === 1, (): string => "Tomorrow is Green Up Day!"],
        [(days: number): boolean => days === 0, (): string => "Green Up Today!"],
        [(days: number): boolean => days < 0, (): string => "Keep on Greening"]
    ]
)(daysUntilCurrentGreenUpDay());

type PropsType = {
    actions: { selectTeam: TeamType => void },
    navigation: Object,
    currentUser: Object,
    myTeams: Array<Object>,
    style: ?Object,
    teams: { [key: string]: TeamType }
};

const isOwner = (teams, user: UserType, teamId: string): boolean => {
    const teamOwner = (teams[teamId] || {}).owner;
    const userIsOwner = teamOwner && teamOwner.uid === user.uid;
    return userIsOwner;
};


const HomeScreen = ({ actions, currentUser, navigation, myTeams, teams }: PropsType): React$Element<any> => {

    const menuConfig = {
        messages: {
            order: 100,
            navigation: "Messages",
            label: "Messages",
            description: "Chat with your team.",
            backgroundImage: require("../../assets/images/horse-wide.jpg"),
            backgroundImageLarge: require("../../assets/images/horse-large.jpg")
        },
        findATeam: {
            order: myTeams.length === 0 ? 1 : 200,
            navigation: "FindTeam",
            label: "Find A Team",
            description: "Who's cleaning where.",
            backgroundImage: require("../../assets/images/girls-wide.jpg"),
            backgroundImageLarge: require("../../assets/images/girls-large.jpg")
        },
        createATeam: {
            order: myTeams.length === 0 ? 2 : 301,
            navigation: "NewTeam",
            label: "Start A Team",
            description: "Be a team captain",
            backgroundImage: require("../../assets/images/ford-wide.jpg"),
            backgroundImageLarge: require("../../assets/images/ford-large.jpg")
        },
        trashDisposal: {
            order: 400,
            navigation: "TrashDisposal",
            label: "Town Information",
            description: "Cleanup Details",
            backgroundImage: require("../../assets/images/dump-truck-wide.jpg"),
            backgroundImageLarge: require("../../assets/images/dump-truck-large.jpg")
        },
        freeSupplies: {
            order: 401,
            navigation: "FreeSupplies",
            label: "Free Supplies",
            description: "Get gloves and bags",
            backgroundImage: require("../../assets/images/car-wide.jpg"),
            backgroundImageLarge: require("../../assets/images/car-large.jpg")
        },
        // celebrations: {
        //     order: 402,
        //     navigation: "Celebrations",
        //     label: "Celebrations",
        //     description: "Fun things to do",
        //     backgroundImage: require("../../assets/images/party-wide.jpg"),
        //     backgroundImageLarge: require("../../assets/images/party-large.jpg")
        // },
        greenUpFacts: {
            order: 403,
            navigation: "GreenUpFacts",
            label: "Green Up Facts",
            description: "All about Green Up Day",
            backgroundImage: require("../../assets/images/posters-wide.jpg"),
            backgroundImageLarge: require("../../assets/images/posters-large.jpg")
        }
    };

    // $FlowFixMe
    const teamButtonsConfig = R.addIndex(R.reduce)((acc: Object, team: TeamType, index): Object => ({
        ...acc,
        [team.id]: {
            order: 20,
            navigation: isOwner(teams, currentUser, (team.id || "foo")) ? "TeamEditor" : "TeamDetails",
            beforeNav: () => {
                actions.selectTeam(team);
            },
            label: team.name || "My Team",
            description: isOwner(teams, currentUser, (team.id || "foo")) ? "Manage Your Team" : "About Your Team",
            backgroundImage: (index % 2 > 0) ? require("../../assets/images/royalton-bandstand-wide.jpg") : require("../../assets/images/govenor-wide.jpg"),
            backgroundImageLarge: (index % 2 > 0) ? require("../../assets/images/royalton-bandstand-large.jpg") : require("../../assets/images/govenor-large.jpg")
        }
    }), {});

    // $FlowFixMe
    const myButtons = R.compose(
        R.map((entry: Array<any>): Object => ({
            onPress: () => {
                if (entry[1].beforeNav) {
                    entry[1].beforeNav();
                }
                navigation.navigate(entry[1].navigation);
            },
            label: entry[1].label,
            backgroundImage: entry[1].backgroundImage,
            backgroundImageLarge: entry[1].backgroundImageLarge,
            description: entry[1].description,
            id: entry[0],
            key: entry[0]
        })),
        R.sort((a: Object, b: Object): number => a[1].order - b[1].order),
        Object.entries
    );

    const teamButtons = teamButtonsConfig(myTeams);
    const buttonConfigs = { ...menuConfig, ...teamButtons };
    const data = myButtons(buttonConfigs);
    let isFirstArticle = (data.length % 2 !== 0); // Show a featured button if we have an odd number of buttons.
    const groupedData = GridRow.groupByRows(data, 2, () => {
        if (isFirstArticle) {
            isFirstArticle = false;
            return 2;
        }
        return 1;
    });

    const renderRow = (rowData, index) => {
        // rowData contains grouped data for one row,
        // so we need to remap it into cells and pass to GridRow
        if (rowData.length === 1) {
            return (
                <TouchableOpacity 
                    key={ index } 
                    onPress={ rowData[0].onPress } 
                    style={{
                        borderLeftWidth: 5,
                        borderRightWidth: 5,
                        borderColor: constants.colorBackgroundDark
                    }}
                    >
                    <ImageBackground
                        style={{height: 120, borderWidth: 0, borderColor: "red"}}
                        imageStyle={{
                            resizeMode: "cover",
                            height: 200, // the image height
                            top: 0
                        }}
                        source={ rowData[0].backgroundImageLarge }
                    >
                        <Tile style={
                                {
                                    borderWidth: 0, 
                                    borderColor: "yellow",
                                    paddingTop: 0,
                                    paddingBottom: 0,
                                    paddingLeft: 10,
                                    paddingRight: 10
                                }
                            }
                        >
                            <Text style={ 
                                    {
                                        color: "white",
                                        fontSize: 30,
                                        fontFamily: "Rubik-Bold",
                                        borderWidth: 0, 
                                        borderColor: "blue",
                                        paddingTop: 0,
                                        paddingBottom: 0,
                                        marginTop: 0,
                                        marginBottom: 0
                                    } 
                                } 
                            >
                                Team { rowData[0].label.toUpperCase() }
                            </Text>
                            <Text style={ 
                                    {
                                        color: "white",
                                        fontSize: 20,
                                        fontFamily: "Rubik-Regular",
                                        fontWeight: "bold",
                                        borderWidth: 0, 
                                        borderColor: "green",
                                        paddingTop: 0,
                                        paddingBottom: 0,
                                        marginTop: 0,
                                        marginBottom: 0
                                    } 
                                }
                            >
                                { rowData[0].description }
                            </Text>

                        </Tile>
                    </ImageBackground>
                    
                </TouchableOpacity>
            );
        }

        const cellViews = rowData.map((item, id) => (
            <TouchableOpacity
                key={ id }
                onPress={ item.onPress }
                styleName="flexible"
            >
                <Card styleName="flexible"
                    style={ { borderColor: "#CCC", borderBottomWidth: 1 } }
                >
                    <Image
                        styleName="medium-wide"
                        source={ item.backgroundImage }
                    />
                    <View style={ {
                        padding: 5,
                        justifyContent: "center",
                        alignItems: "center",
                        width: "100%"
                    } } styleName="content">
                        <Subtitle
                            style={ {
                                fontFamily: "Rubik-Regular",
                                textAlign: "center",
                                fontSize: 17
                            } }
                            numberOfLines={ 1 }>
                            { item.label.toUpperCase() }
                        </Subtitle>
                        <View styleName="horizontal">
                            <Text style={ { fontFamily: "Rubik-Regular", textAlign: "center" } }
                                styleName="collapsible">{ item.description }</Text>
                        </View>
                    </View>
                </Card>
            </TouchableOpacity>
        ));

        return (
            <GridRow style={ { backgroundColor: constants.colorBackgroundDark } } columns={ 2 }>
                { cellViews }
            </GridRow>
        );
    };


    return (
        <SafeAreaView style={ [styles.container, { backgroundColor: constants.colorBackgroundDark }] }>
            <ListView
                data={ groupedData }
                renderRow={ renderRow }
                contentContainerStyle={ { backgroundColor: "red" } }
                renderFooter={ () => (<View style={ { width: "100%", height: 10, backgroundColor: constants.colorBackgroundDark } }/>) }
            />
        </SafeAreaView>
    );
};

HomeScreen.navigationOptions = {
    title: homeTitle,
    headerStyle: {
        backgroundColor: constants.colorBackgroundDark,
        borderWidth: 0
    },
    headerTintColor: "#fff",
    headerTitleStyle: {
        fontFamily: "Rubik-Regular",
        fontWeight: "bold",
        fontSize: 20,
        color: constants.colorHeaderText
    },
    headerBackTitleStyle: {
        fontFamily: "Rubik-Regular",
        fontWeight: "bold",
        fontSize: 20,
        color: constants.colorHeaderText
    }
};

const mapStateToProps = (state: Object): Object => {
    const user = User.create({ ...state.login.user, ...removeNulls(state.profile) });
    const teams = state.teams.teams || {};
    const myTeams = getUsersTeams(user, teams);
    return ({ myTeams, currentUser: user, teams });
};

const mapDispatchToProps = (dispatch: Dispatch<Object>): Object => ({
    actions: bindActionCreators({ selectTeam }, dispatch)
});

// $FlowFixMe
export default connect(mapStateToProps, mapDispatchToProps)(HomeScreen);
