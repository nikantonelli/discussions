Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    
launch: function() {
    var that =  this;
        var millisecondsInDay = 86400000;
        var currentDate = new Date();
        var startDate = new Date(currentDate - millisecondsInDay*30); //in the last 30 days
        var startDateUTC = startDate.toISOString();
        
        this._filters = [
            {
                property : 'CreationDate',
                operator : '>=',
                value : startDateUTC
                
            }	
   	];
        
        Ext.create('Rally.data.wsapi.Store',{
	    model: 'ConversationPost',
	    autoLoad: true,
	    remoteSort: false,
	    fetch: ['Artifact','Text','CreationDate', 'User', 'FormattedID', 'ScheduleState', 'PlanEstimate'],
	    filters: this._filters,
	    listeners: {
		load: that._onConversationsLoaded,
		scope:this
	    }
   	});

   },
   _onConversationsLoaded: function(store,data){
        var posts = [];
        _.each(data, function(post) {
            var p  = {
                User: post.get('User')._refObjectName,
                Text: post.get('Text'),
                CreationDate: post.get('CreationDate'),
                Name: post.get('Artifact').FormattedID,
                Artifact: post.get('Artifact').FormattedID,
                ScheduleState: post.get('Artifact').ScheduleState,
                PlanEstimate: post.get('Artifact').PlanEstimate
            };
            posts.push(p);
            });
        this._createGrid(posts);
   },
   
   _createGrid: function(posts) {
        _store = Ext.create('Rally.data.custom.Store', {
                data: posts,
                groupField: 'Artifact',
                pageSize: 100
            });
        if (!this.grid) {
        this.grid = this.add({
            xtype: 'rallygrid',
            itemId: 'mygrid',
            store: _store,
            features: [{ftype:'grouping'}],
            columnCfgs: [
                {
                   text: 'Artifact', dataIndex: 'Artifact'
                },
                {text: 'Schedule State', dataIndex: 'ScheduleState'},
                {text: 'Plan Estimate', dataIndex: 'PlanEstimate'},
                {text: 'Conversation Post Text', dataIndex: 'Text',flex: 1},
                {text: 'Conversation Post Creation Date', dataIndex: 'CreationDate', flex: 1}
            ]
        });
         
         }else{
            this.grid.reconfigure(_store);
         }
    }

});
