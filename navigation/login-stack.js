// @flow

import Login from "../screens/login-screen";
import CreateNewAccount from "../screens/create-new-account-screen";
import ForgotPassword from "../screens/forgot-password-screen";
import { createAppContainer } from "react-navigation";
import { createStackNavigator } from "react-navigation-stack";

const AppNavigator = createStackNavigator({
    Login: {
        screen: Login
    },
    CreateNewAccount: {
        screen: CreateNewAccount
    },
    ForgotPassword: {
        screen: ForgotPassword
    }
});

// $FlowFixMe
export default createAppContainer(AppNavigator);
