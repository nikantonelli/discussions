Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    
launch: function() {
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
        
        var myStore = Ext.create('Rally.data.WsapiDataStore',{
   		model: 'ConversationPost',
		autoLoad: true,
		remoteSort: false,
   		fetch: ['Artifact','Text','CreationDate', 'User', 'FormattedID'],
   		filters: this._filters,
   		listeners: {
   			load: function(store,records,success){
   				console.log("loaded %i records", records.length);
   				this._makeGrid(myStore);
   			},
   			scope:this
   		}
   	});

   },
   
   _makeGrid: function(myStore){
    console.log('make grid');
   	this._myGrid = Ext.create('Rally.ui.grid.Grid', {
		store: myStore,	
   		columnCfgs: [
   			{text: 'Artifact', dataIndex: 'Artifact', flex: 1,
                            renderer: function(artifact){
				return '<a href="' + Rally.nav.Manager.getDetailUrl(artifact) + '">' + artifact.FormattedID + '</a>'
			}
                        },
   			{text: 'Text', dataIndex: 'Text', flex: 2},
			{text: 'CreationDate', dataIndex: 'CreationDate', flex: 1},
			{text: 'User', dataIndex: 'User', flex: 1},
   		],
		height: 650

   	});
   	this.add(this._myGrid);
   }
   

});
