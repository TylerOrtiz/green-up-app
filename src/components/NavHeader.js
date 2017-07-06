// @flow
import React from 'react';
import PropTypes from 'prop-types';
import {StyleSheet, Text, Alert, View, TouchableHighlight} from 'react-native';
import Row from './Row';
import {MaterialIcons} from '@expo/vector-icons';


const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        padding: 20,
        justifyContent: 'space-between',
        borderBottomColor: '#E1E1E1',
        borderBottomWidth: 1
    },
    header_button: {
        //flex: 1,

        width: 32
    },
    whitespace: {
        flex: 1
    },
    back_button: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    back_button_label: {
        color: '#397CA9',
        fontSize: 20
    },
    header_text: {
        flex: 1,
        alignSelf: 'center'
    },
    header_text_label: {
        fontSize: 20,
        textAlign: 'center'
    }
});
class NavHeader extends React.Component {
    static propTypes = {
        navigation: PropTypes.object,
        previousScreenName: PropTypes.string,
        screenTitle: PropTypes.string
    };

    constructor(props) {
        super(props);
        this._onPressButton = this._onPressButton.bind(this);
        this._onNavigatorEvent = this._onNavigatorEvent.bind(this);
        this.state = {drawerState: 'close'};
    }

    _onPressButton(drawerState: ?string) {
        function openClose(drawerAction) {
            return function () {
                if (drawerAction === 'close') {
                    this.props.navigation.navigate('DrawerClose');
                } else {
                    this.props.navigation.navigate('DrawerOpen');
                }
            };
        }

        if (drawerState === 'open' || drawerState === 'closed') {
            return () => {
                this.setState({drawerState: newState}, openClose(drawerState));
            };
        }
        let newState = this.state.drawerState === 'open' ? 'close' : 'open';
        this.setState({drawerState: newState}, openClose(newState));
    }


    _onNavigatorEvent(event) {
        this.props.navigation.pop();
    }

    render() {
        var backButton = this.props.showBackButton
            ? (
                             <TouchableHighlight
                                 style={styles.header_button}
                                 onPress={this._onNavigatorEvent}
                                 underlayColor={'rgba(0, 0, 0, 0.054)'}
                             >
                                 <View style={styles.back_button}>
                                     <MaterialIcons name="keyboard-arrow-left" size={24} color="blue"/>
                                     <Text
                                         style={[styles.back_button_label]}>{this.props.previousScreenName || "back"}</Text>
                                 </View>
                             </TouchableHighlight>
                         )
            : null;

        return (
            <View style={styles.header}>
                {backButton}
                <View style={styles.header_text}>
                    <Text style={styles.header_text_label}>{this.props.screenTitle || " " }</Text>
                </View>
                <TouchableHighlight
                    style={styles.header_button}
                    onPress={this._onPressButton('open')}
                    underlayColor={'rgba(0, 0, 0, 0.054)'}
                >
                    <MaterialIcons name="menu" size={32} color="black"/>
                </TouchableHighlight>
            </View>
        );
    }
}
export default NavHeader;