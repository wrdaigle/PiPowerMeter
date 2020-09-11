const actions = {
     SET_POWER_DATA: 'SET_POWER_DATA',
     SET_CHART_SETTINGS: 'SET_CHART_SETTINGS'
};

const appReducer = (state, action) => {
    switch (action.type) {
        case actions.SET_POWER_DATA:
            return {
                ...state,
                powerData: action.to
            };
        case actions.SET_CHART_SETTINGS:
            console.debug(action)
            return {
                ...state,
                chartSettings: action.to
            }
        default:
            throw new Error();
    }
};

export { appReducer, actions };
