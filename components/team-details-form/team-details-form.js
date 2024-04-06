//  @flow
import React, { useReducer, useMemo } from "react";
import {
    Alert,
    Keyboard,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    KeyboardAvoidingView,
    View, 
    Text,
    Pressable,
    TextInput
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MiniMap from "@/components/mini-map";
import DateTimePicker from "@react-native-community/datetimepicker"
import moment from "moment";
import { localeDate, localeTime } from '@/libs/datetime';
import { defaultStyles } from "@/styles/default-styles";
import Team from "@/models/team";
import User from "@/models/user";
import ButtonBar from "@/components/button-bar";
import { getCurrentGreenUpDay } from "@/libs/green-up-day-calucators";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { findTownIdByCoordinates } from "@/libs/geo-helpers";
import { LineDivider } from "@/components/divider";
import colors from "@/constants/colors";
import { PrimaryButton } from "@/components/button";
const myStyles = {
    selected: {
        opacity: 1
    },
    switchButton: {
        paddingTop: 15,
        paddingBottom: 15,
        width: '50%',
        justifyContent: 'center',
        flexDirection: 'row',
        alignItems: 'center',
    },
    switchButtonActive: {
        backgroundColor: colors.backgroundLight
    },
    switchButtonInactive: {
        backgroundColor: colors.backgroundDark
    }

};

const styles = StyleSheet.create({...defaultStyles, ...myStyles});
const dateRangeMessage = `${ moment(getCurrentGreenUpDay()).utc().format("dddd, MMM Do YYYY") } is the next Green Up Day, but teams may choose to work up to one week before or after.`;
const freshState = (owner: UserType, team: ?TeamType, initialMapLocation: ?CoordinatesType = null): Object => ({
    team: Team.create(team || { owner }),
    query: "",
    town: "",
    locations: [],
    date: null,
    end: null,
    startdate: null,
    cleanDate: null,
    cleanStartTime: null,
    cleanEndTime: null,
    initialMapLocation
});
const setTime = (date: Date, time: string): Date => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    // $FlowFixMe
    const year = date.getYear() + 1900;
    return new Date(`${ year }-${ month }-${ day }T${ time }:00`);
    //return new Date(year, month, day, );
};

function reducer(state: Object, action: Object): Object {
    switch (action.type) {
        case "SET_TEAM_STATE":
            return { ...state, team: { ...state.team, ...action.data } };
        case "RESET_STATE":
            return action.data;
        default:
            throw new Error("Invalid action type");
    }
}

type PropsType = {
    currentUser: User,
    otherCleanAreas: Array<any>,
    team: TeamType,
    onSave: TeamType => void,
    children: any
};

const cleanupDatePicker = "cleanupDatePicker";
const cleanupStartTimePicker = "cleanupStartTimePicker";
const cleanupEndTimePicker = "cleanupEndTimePicker";

const initialDatepickerState = {
    [cleanupDatePicker]: false,
    [cleanupStartTimePicker]: false,
    [cleanupEndTimePicker]: false,
}

const datepickerStateReducer = (state, action) => {
    if (![cleanupDatePicker, cleanupStartTimePicker, cleanupEndTimePicker].includes(action?.data?.picker)) {
        throw new Error("Invalid picker type");
    }

    switch (action.type) {
        case "OPEN_PICKER":
            return { ...state, [action.data.picker]: true };
        case "CLOSE_PICKER":
            return { ...state, [action.data.picker]: false };
        default:
            throw new Error("Invalid action type");
    }
}

export const TeamDetailsForm = ({ currentUser, children, otherCleanAreas, team, onSave }: PropsType): React$Element<any> => {
    const [datePickerState, dispatchDatePicker] = useReducer(datepickerStateReducer, initialDatepickerState);
    const [state, dispatch] = useReducer(reducer, freshState(currentUser, team));

    const openDatePicker = (picker) => () => {
        console.log('openDatePicker', picker);
        dispatchDatePicker({ type: "OPEN_PICKER", data: { picker } });
    }

    const closeDatePicker = (picker) => () => {
        console.log('closeDatePicker', picker);
        dispatchDatePicker({ type: "CLOSE_PICKER", data: { picker } });
    }

    const startDateDisplay = useMemo(() => {
        if (!state?.team?.cleanDate) {
            return null;
        }
        const date = new Date(state.team.cleanDate);
        return localeDate(date);
        // previous property team.startdate
        // new property team.cleanDate
    }, [state.team.cleanDate]);

    const startTimeDisplay = useMemo(() => {
        if (!state?.team?.cleanStartTime) {
            return null;
        }
        const date = new Date(state.team.cleanStartTime);
        return localeTime(date);
        // previous property team.date
        // new property team.cleanStartTime
    }, [state.team.cleanStartTime]);

    const endTimeDisplay = useMemo(() => {
        if (!state?.team?.cleanEndTime) {
            return null;
        }
        const date = new Date(state.team.cleanEndTime);
        return localeTime(date);
        // previous property team.end
        // new property team.cleanEndTime
    }, [state.team.cleanEndTime]);

    const handleMapClick = (coordinates: Object) => {
        Keyboard.dismiss();
        const town = findTownIdByCoordinates(coordinates);
        dispatch({
            type: "SET_TEAM_STATE",
            data: {
                town,
                locations: state.team.locations.concat({
                    title: "Clean Area",
                    description: "tap to remove",
                    coordinates
                })
            }
        });
    };

    const removeLastMarker = () => {
        const locations = state.team.locations.slice(0, state.team.locations.length - 1);
        dispatch({ type: "SET_TEAM_STATE", data: { locations } });
    };

    const removeMarker = (index: number) => {
        const myLocations = state.team.locations || [];
        if (index < myLocations.length) {
            const locations = myLocations.slice(0, index).concat(myLocations.slice(index + 1));
            dispatch({ type: "SET_TEAM_STATE", data: { locations } });
        }
    };

    const cancel = () => {
        dispatch({ type: "RESET_STATE", data: freshState(currentUser, team) });
    };

    const createTeam = () => {
        const myTeam = Team.create({ ...state.team });
        if (!myTeam.name) {
            Alert.alert("Please give your team a name.");
        } else {
            onSave(myTeam);
        }
    };

    const setTeamValue = (key: string): (any=>void) => (value: any) => {
        dispatch({
            type: "SET_TEAM_STATE",
            data: { [key]: value }
        });
    };

    const onCleanDateChanged = (event, pickedDate: Date) => {
        const {
            type,
            nativeEvent: {timestamp, utcOffset},
          } = event;

        switch (type) {
            case "dismissed":
                closeDatePicker(cleanupDatePicker)
                break;
            case "set":
                console.log('cleanDateChanged', pickedDate);
                // setTeamValue("date")(pickedDate);
                setTeamValue("cleanDate")(pickedDate);
                closeDatePicker(cleanupDatePicker)
                break;
        }
    };

    const onCleanStartTimeChanged = (event, pickedTime: Date) => {
        const {
            type,
            nativeEvent: {timestamp, utcOffset},
          } = event;

        switch(type) {
            case "dismissed":
                closeDatePicker(cleanupStartTimePicker)
                break;
            case "set":
                console.log('cleanStartTimeChanged', pickedTime);
                // setTeamValue("startdate")(pickedTime);
                setTeamValue("cleanStartTime")(pickedTime);
                closeDatePicker(cleanupStartTimePicker)
                break;
        }
    };

    const onCleanEndTimeChanged = (event, pickedTime: Date) => {
        const {
            type,
            nativeEvent: {timestamp, utcOffset},
          } = event;

        switch(type) {
            case "dismissed":
                closeDatePicker(cleanupEndTimePicker)
                break;
            case "set":
                console.log('cleanEndTimeChanged', pickedTime);
                // setTeamValue("end")(pickedTime);
                setTeamValue("cleanEndTime")(pickedTime);
                closeDatePicker(cleanupEndTimePicker)
                break;
        }
    };

    // DateTimePicker

    const dateIsSelected = state.team.date === null;
    const endIsSelected = state.team.end === null;
    const startIsSelected = state.team.startdate === null;
    const applyDateOffset = (date: Date, days: number): Date => {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    };
    const eventDate = getCurrentGreenUpDay();
    const defaultStartTime = setTime( eventDate, (state.team.startdate || "09:00"));
    // console.log("state.team.startdate:",state.team.startdate);
    // console.log("defaultStartTime:",defaultStartTime.toLocaleString('en-GB'));
    const defaultEndTime = setTime( eventDate, (state.team.end || "17:00"));
    // console.log("state.team.end:",state.team.end);
    // console.log("defaultEndTime:",defaultEndTime.toLocaleString('en-GB'));
    const minDate = new Date(); //applyDateOffset(eventDate, -6);
    const maxDate = applyDateOffset(minDate, 364);
    const headerButtons = [{ text: "Save", onClick: createTeam }, { text: "Clear", onClick: cancel }];

    const pinsConfig = state.team.locations
        .map(l => ({
            coordinates: l.coordinates,
            title: state.team.name,
            description: "Click here to remove pin",
            onCalloutPress: removeMarker,
            color: "green"
        }))
        .concat(otherCleanAreas.map(o => ({ ...o, color: "yellow" })));

    return (

        <SafeAreaView style={ styles.container }>
            <ButtonBar buttonConfigs={ headerButtons }/>

                <KeyboardAvoidingView
                    keyboardVerticalOffset={ 100 }
                    style={ { flex: 1 } }
                    behavior={ Platform.OS === "ios" ? "padding" : null }
                >
                    <View style={ { flex: 1, justifyContent: "flex-end" } }>
                        <ScrollView
                            style={ styles.scroll }
                            // automaticallyAdjustContentInsets={ false }
                            scrollEventThrottle={ 200 }
                        >
                            <View style={ styles.formControl }>
                                <Text style={ styles.label }>{ "Team Name" }</Text>
                                <TextInput
                                    style={styles.textInput}
                                    keyBoardType={ "default" }
                                    onChangeText={ setTeamValue("name") }
                                    placeholder={ "Team Name" }
                                    value={ state.team.name }
                                    underlineColorAndroid={ "transparent" }
                                />
                            </View>

                            <View style={ styles.formControl }>
                                <Text style={ styles.label }>
                                    { state.team.isPublic ? "Anyone can join your team" : "You control who joins your team" }
                                </Text>
                                <View style={{flex: 1, flexDirection: 'row'}} >
                                    <Pressable
                                        style={ [styles.switchButton, state.team.isPublic ? styles.switchButtonActive : styles.switchButtonInactive] }
                                        onPress={ () => setTeamValue("isPublic")(true) }>
                                        <MaterialCommunityIcons
                                            name="earth"
                                            size={ 25 }
                                            style={ { marginRight: 10 } }
                                            color={ !state.team.isPublic ? "#555" : "black" }
                                        />
                                        <Text
                                            style={state.team.isPublic ? {color:"black"} : {color: "white"}}>
                                            PUBLIC
                                        </Text>
                                    </Pressable>
                                    <Pressable
                                        style={ [styles.switchButton, state.team.isPublic ? styles.switchButtonInactive : styles.switchButtonActive] }
                                        onPress={ () => setTeamValue("isPublic")(false) }>
                                        <MaterialCommunityIcons
                                            name="earth-off"
                                            size={ 25 }
                                            style={ { marginRight: 10 } }
                                            color={ state.team.isPublic ? "#555" : "black" }
                                        />
                                        <Text
                                            style={state.team.isPublic ? {color:"white"} : {color: "black"}}>
                                            PRIVATE
                                        </Text>
                                    </Pressable>
                                </View>
                            </View>
                            <LineDivider style={ { marginTop: 20, marginBottom: 20 } }/>
                            <View style={ styles.formControl }>
                                <Text style={ styles.label }>{ "Clean Up Site" }</Text>
                                <TextInput
                                    style={styles.textInput}
                                    keyBoardType={ "default" }
                                    onChangeText={ setTeamValue("location") }
                                    placeholder={ "The park, school, or road name" }
                                    placeholderTextColor={colors.placeholderText}
                                    value={ state.team.location }
                                    underlineColorAndroid={ "transparent" }
                                />
                            </View>
                            <View style={ styles.formControl }>
                                <Text style={ { ...styles.label, maxHeight: 63 } }>
                                    { "Mark your spot(s)" }
                                </Text>
                                <MiniMap
                                    pinsConfig={ pinsConfig }
                                    onMapClick={ handleMapClick }
                                />
                                <PrimaryButton
                                    onPress={ removeLastMarker }
                                >
                                    <Text>{ "REMOVE MARKER" }</Text>
                                </PrimaryButton>
                            </View>
                            <LineDivider style={ { marginTop: 20, marginBottom: 20 } }/>
                            <View style={ styles.formControl }>
                                <Text style={ styles.alertInfo }>
                                    { dateRangeMessage }
                                </Text>
                            </View>
                            <View style={ styles.formControl }>
                                <Text style={ styles.label }>{ "Which day will your team be cleaning?" }</Text>
                                <View>
                                    <TouchableOpacity onPress={openDatePicker(cleanupDatePicker)}>
                                        <Text
                                            style={ { ...styles.textInput, ...(dateIsSelected ? styles.selected : {}) } }>
                                            {startDateDisplay || "Which day will your team be cleaning?"}
                                        </Text>
                                    </TouchableOpacity>
                                    { datePickerState[cleanupDatePicker] && <DateTimePicker
                                        mode="date"
                                        value={ eventDate }
                                        minimumDate={ minDate }
                                        maximumDate={ maxDate }
                                        onChange={onCleanDateChanged}
                                        titleIOS={ "Which day is your team cleaning?" }
                                        titleStyle={ styles.datePickerTitleStyle }
                                    /> }
                                </View>
                            </View>
                            <View style={ styles.formControl }>
                                <Text style={ styles.label }>{ "What time will your team start?" }</Text>
                                <View>
                                    <TouchableOpacity onPress={openDatePicker(cleanupStartTimePicker)}>
                                        <Text
                                            style={ { ...styles.textInput, ...(startIsSelected ? styles.selected : {}) } }>
                                            {startTimeDisplay || "Pick a Starting Time"}
                                        </Text>
                                    </TouchableOpacity>
                                    {  datePickerState[cleanupStartTimePicker] && <DateTimePicker
                                        mode="time"
                                        value={ defaultStartTime }
                                        onChange={onCleanStartTimeChanged}
                                        is24Hour={ false }
                                        titleIOS={ "Pick a starting time." }
                                        titleStyle={ styles.datePickerTitleStyle }
                                    /> }
                                </View>
                            </View>
                            <View style={ styles.formControl }>
                                <Text style={ styles.label }>{ "What time will your team end?" }</Text>
                                <View>
                                    <TouchableOpacity onPress={openDatePicker(cleanupEndTimePicker)}>
                                        <Text
                                            style={ { ...styles.textInput, ...(endIsSelected ? styles.selected : {}) } }>
                                            {endTimeDisplay || "Pick an Ending Time"}
                                        </Text>
                                    </TouchableOpacity>
                                    {  datePickerState[cleanupEndTimePicker] && <DateTimePicker
                                        mode="time"
                                        value={ defaultEndTime }
                                        onChange={onCleanEndTimeChanged}
                                        is24Hour={ false }
                                        titleIOS={ "Pick an ending time." }
                                        titleStyle={ styles.datePickerTitleStyle }
                                    /> }
                                </View>
                            </View>

                            <LineDivider style={ { marginTop: 20, marginBottom: 20 } }/>
                            <View style={ styles.formControl }>
                                <Text style={ styles.label }>{ "Team Information" }</Text>
                                <TextInput
                                    style={ styles.textArea }
                                    keyBoardType={ "default" }
                                    multiline={ true }
                                    numberOfLines={10}
                                    textAlignVertical="top"
                                    onChangeText={ setTeamValue("description") }
                                    placeholder={ "Add important information here" }
                                    placeholderTextColor={colors.placeholderText}
                                    value={ state.team.description }
                                    underlineColorAndroid={ "transparent" }
                                />
                            </View>
                            { children }
                        </ScrollView>

                        <View style={ { flex: 1 } }/>
                    </View>
                </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

