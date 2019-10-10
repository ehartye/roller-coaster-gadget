const Alexa = require('ask-sdk-core');
const Util = require('./util');
const Common = require('./common');

// The namespace of the custom directive to be sent by this skill
const NAMESPACE = 'Custom.Mindstorms.Gadget';

// The name of the custom directive to be sent this skill
const NAME_CONTROL = 'control';

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle: async function(handlerInput) {

        let request = handlerInput.requestEnvelope;
        let { apiEndpoint, apiAccessToken } = request.context.System;
        let apiResponse = await Util.getConnectedEndpoints(apiEndpoint, apiAccessToken);
        if ((apiResponse.endpoints || []).length === 0) {
            return handlerInput.responseBuilder
            .speak(`I couldn't find an EV3 Brick connected to this Echo device. Please check to make sure your EV3 Brick is connected, and try again.`)
            .getResponse();
        }

        // Store the gadget endpointId to be used in this skill session
        let endpointId = apiResponse.endpoints[0].endpointId || [];
        Util.putSessionAttribute(handlerInput, 'endpointId', endpointId);

        return handlerInput.responseBuilder
            .speak("Welcome! To ride the Lego Roller Coaster, you must be less than two inches tall! How many times would you like to ride?")
            .reprompt("If you're not sure what to do, try saying 3 rides please.")
            .getResponse();
    }
};

// Get the lap count
const SetLapIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'SetLapIntent';
    },
    handle: function (handlerInput) {
        let lapCount = Alexa.getSlotValue(handlerInput.requestEnvelope, 'LapCount');
        lapCount = Math.max(1, parseInt(lapCount));

        if (!Number.isInteger(lapCount)) {
            return handlerInput.responseBuilder
                .speak("Can you repeat that?")
                .reprompt("What was that again?").getResponse();
        }
        
        Util.putSessionAttribute(handlerInput, 'lapCount', lapCount);
        const attributesManager = handlerInput.attributesManager;
        const endpointId = attributesManager.getSessionAttributes().endpointId || [];
        const directive = Util.build(endpointId, NAMESPACE, NAME_CONTROL,
            {
                type: 'rideStart',
                lapCount: lapCount
            });
        return handlerInput.responseBuilder
            .speak(`Hold on to your studs, and enjoy your ${lapCount} lap ride!`)
            //.reprompt("awaiting command")
            .addDirective(directive)
            .getResponse();
    }
};

// Construct and send a custom directive to the connected gadget with data from
// the SetCommandIntent request.

// The SkillBuilder acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        SetLapIntentHandler,
        Common.HelpIntentHandler,
        Common.CancelAndStopIntentHandler,
        Common.SessionEndedRequestHandler,
        Common.IntentReflectorHandler, // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
    )
    .addRequestInterceptors(Common.RequestInterceptor)
    .addErrorHandlers(
        Common.ErrorHandler,
    )
    .lambda();