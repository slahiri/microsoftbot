    var request = require('request');
    
    //require('dotenv').load();
    var thread_settings= {
         
        greeting: function(greeting) {
            var message = {
                'setting_type': 'greeting',
                'greeting': {
                    'text': greeting
                }
            };
            thread_settings.postAPI(message);
        },
        get_started: function(payload) {
            var message = {
                'setting_type': 'call_to_actions',
                'thread_state': 'new_thread',
                'call_to_actions':
                    [
                        {
                            'payload': payload
                        }
                    ]
            };
            
            thread_settings.postAPI(message);
        },
         menu: function(payload) {
            var message = {
                'setting_type': 'call_to_actions',
                'thread_state': 'existing_thread',
                'call_to_actions': payload
            };
            thread_settings.postAPI(message);
        },
        postAPI: function(message) {
            request.post('https://graph.facebook.com/v2.6/me/thread_settings?access_token=' + process.env['FB_ACCESS_TOKEN'],
                {form: message},
                function(err, res, body) {
                    if (err) {
                        console.log('Could not configure thread settings');
                    } else {

                        var results = null;
                        try {
                            results = JSON.parse(body);
                        } catch (err) {
                            console.log('ERROR in thread_settings API call: Could not parse JSON', err, body);
                        }

                        if (results) {
                            if (results.error) {
                                console.log('ERROR in thread_settings API call: ', results.error.message);
                            } else {
                                console.log('Successfully configured thread settings', body);
                            }
                        }

                    }
                });
        },
       
    };
 
module.exports.facebook_thread_setting = thread_settings;  


