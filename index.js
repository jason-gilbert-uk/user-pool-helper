/*
-------------------------------------------------------------------------
Function: getUserInfo

Purpose:
    Use this function to obtain user information from the req object passed
    to your rest api call via Amazon API Gateway.

How to Use:
    var userInfo = require('./userInfo')
    await userInfo.getUserInfo(req).then((user)=>{
        ...   
    });

Information returned:
    Information is returned in the structure below. fields are self explanitory.
    {
        Username: 'jaren6',
        Attributes: [
            { Name: 'sub', Value: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' },
            { Name: 'email_verified', Value: 'true' },
            { Name: 'phone_number_verified', Value: 'false' },
            { Name: 'email', Value: 'myname@someaddress.com' }
        ],
        UserCreateDate: 2022-01-22T14:38:05.518Z,
        UserLastModifiedDate: 2022-01-22T14:38:16.251Z,
        Enabled: true,
        UserStatus: 'CONFIRMED',
        groups: [ 'wizards', 'Admin' ]
    }
-------------------------------------------------------------------------
Function: getAllUsersInfo

Purpose:
    Use this function to obtain information on all users and the groups 
    they are in.

How to Use:
    var userInfo = require('./userInfo')
    await userInfo.getAllUsersInfo().then((user)=>{
        ...   
    });

Information returned:
    Information is returned in the structure below. fields are self explanitory.
    [
    {
        Username: 'jaren6',
        Attributes: [
            { Name: 'sub', Value: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' },
            { Name: 'email_verified', Value: 'true' },
            { Name: 'phone_number_verified', Value: 'false' },
            { Name: 'email', Value: 'myname@someaddress.com' }
        ],
        UserCreateDate: 2022-01-22T14:38:05.518Z,
        UserLastModifiedDate: 2022-01-22T14:38:16.251Z,
        Enabled: true,
        UserStatus: 'CONFIRMED',
        groups: [ 'wizards', 'Admin' ]
    },
    ...
]
-------------------------------------------------------------------------
Dependencies: aws-sdk
*/

    const AWS = require('aws-sdk');
    const cognito = new AWS.CognitoIdentityServiceProvider({apiVersion:'2016-04-18'})
    
    var userPoolId = process.env.AUTH_DEMO10D7EC2667_USERPOOLID
    
    async function getUserInfo(req,userPoolId) {
        const {event}   = req.apiGateway
        let userSub     = event.requestContext.identity.cognitoAuthenticationProvider.split(':CognitoSignIn:')[1];
        let userParams  = { UserPoolId: userPoolId, Filter: `sub="${userSub}"`}
        let userData    = await cognito.listUsers(userParams).promise()
        var groupParams = { UserPoolId : userPoolId,Username: userData.Users[0].Username}
        
        try {
                const groupData = await cognito.adminListGroupsForUser(groupParams).promise();
                const groupsForUser = groupData.Groups.map(group=>group.GroupName);
                userData.Users[0].groups = groupsForUser;
                return userData.Users[0];
        } catch (err) {
            console.log("getUserInfo encounted error: ",err);
            return {}
        }
      }
    
    
      async function getAllUsersInfo(userPoolId) {
        let userParams  = { UserPoolId: userPoolId}
        try {
            let userData = await cognito.listUsers(userParams).promise();

            for (let i=0;i<userData.Users.length;i++) {
                var groupParams = { UserPoolId : userPoolId,Username: userData.Users[i].Username}
                try {
                        const groupData = await cognito.adminListGroupsForUser(groupParams).promise();
                        const groupsForUser = groupData.Groups.map(group=>group.GroupName);
                        userData.Users[i].groups =["*NONE*"];
                        if (groupsForUser) {
                            userData.Users[i].groups = groupsForUser;
                        }
        
                } catch (err) {
                    console.log("getUserInfo encounted error: ",err);
                    return {}
                }   
            }
            return userData.Users;

        } catch(err) {
            console.log("error encountered in getAllUsersInfo: ",err)
            return {}
        }
    }

    async function createGroup(groupName,userPoolId) {
        let userParams  = { GroupName: groupName,UserPoolId: userPoolId}
        try {
            let response = await cognito.createGroup(userParams).promise();
            return response;
        } catch (err) {
            console.log('error in createGroup: ',err)
        }
    }
    
    exports.getUserInfo = getUserInfo;
    exports.getAllUsersInfo = getAllUsersInfo;
    exports.createGroup = createGroup;