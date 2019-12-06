Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    
launch: function() {
    var that =  this;
    var minutesInDay = 1440;
    var daysToSee = 14;
    
//    this._filters = [];
    this._filters = [
            {
            property : 'LastUpdateDate',
            operator : '>=',
            value : Ext.Date.subtract(new Date(), Ext.Date.MINUTE, minutesInDay * daysToSee)
            
        }	
   	];
        
    Ext.create('Rally.data.wsapi.artifact.Store',{
        models: ['UserStory', 'Defect', 'Task'],
        context: this.getContext().getDataContext(),
        autoLoad: true,
        remoteSort: false,
	    // sorters: [
        // {
        //     property: 'CreationDate',
        //     direction: 'DESC'
        // }
        // ],
	    fetch: ['FormattedID','TargetDate', 'Discussion', 'LatestDiscussionAgeInMinutes','LastUpdateDate', 'Name', 'State', 'ScheduleState', 'Owner', 'PlanEstimate'],
	    filters: this._filters,
	    listeners: {
		load: that._onArtifactsLoaded,
		scope:this
	    }
   	});

   },
   _onArtifactsLoaded: function(store,data){
        //Sort the records into the order of most recent post.
        // this._createGrid(_.sortBy( data, function(record) {
        //     return record.get('LatestDiscussionAgeInMinutes')
        // }));
        store.sort( {
            property: 'LatestDiscussionAgeInMinutes',
            direction: 'ASC'
        });
        this._createGrid(store.getRecords());
   },
   
   _createGrid: function(data) {

        _.each(data, function(record) {
            record.raw.lastPost = '';
            record.raw.posts = Ext.create('Rally.data.wsapi.Store' , {
                model: 'ConversationPost',
                data: []
            })
        });

        _store = Ext.create('Rally.data.custom.Store', {
                data: data,
                groupField: 'FormattedID',
                pageSize: 100
            });
        if (!this.grid) {
        this.grid = this.add({
            margin: 20,
            xtype: 'rallygrid',
            itemId: 'mygrid',
            store: _store,
    //         listeners: {
    //             onExpandBody: function(record) {
    //                 debugger;
    //            var ret = '';
    //            if (record.data.posts) {
    //                _.each(record.data.posts, function(post) {
    //                    ret += '<p>' + post.get('Text') + '</p>';
    //                });
    //            }
    //            return ret;
    //    }                

    //         },
            // plugins: [{
            //     ptype: 'rowexpander',
            //     rowBodyTpl: new Ext.XTemplate('{[this.getData(values)]}',
            //         {
            //             getData: function(values) {
            //                 debugger;
            //                 return 'Fetching...';
            //             }
            //         }
            //     )
            // }],
            collapsible: true,
            columnCfgs: [
                {
                   text: 'Artifact', dataIndex: 'FormattedID'
                },
                {text: 'Title', dataIndex: 'Name', flex: 1},
                {text: 'Last Artefact Update', dataIndex: 'LastUpdateDate', xtype: 'datecolumn', format: 'F j, Y, g:i a'},
                {text: 'Schedule State', dataIndex: 'ScheduleState'},
                {
                    text: 'Plan Estimate', 
                    dataIndex: 'PlanEstimate',
                },
                {text: 'Last Post', flex: 2, dataIndex: 'lastPost', renderer: function(cellvalue, cell, record, idx, count, store, grid) {
                    if ((record.raw.posts.getRecords().length === 0) && (record.get('Discussion').Count > 0)) {

                        record.getCollection('Discussion').load({
                            fetch: ['Text', 'CreationDate'],
                            sorters: [
                                {
                                    property: 'CreationDate',
                                    direction: 'DESC'
                                }
                            ],
                            callback: function (records, operation, success) {
                                if (success) {
                                    _.each(records, function(item) {
                                        console.log('adding: ', item, ' to: ', record.raw.posts);
                                        record.raw.posts.add(item);
                                    })
                                    record.set('lastPost', records[0].get('Text'));   //If we have ordered the right way, we will have the latest first.
                                }else {
                                    record.set('lastPost','');
                                }
                            }
                        });
                        return 'Fetching..';
                    } else {
                        return record.get('lastPost');
                    }
                }},
                {text: 'Last Discussion Date', dataIndex: 'LatestDiscussionAgeInMinutes', renderer: function(age) {
                        if (age) {
                            return Ext.Date.format(Ext.Date.subtract(new Date(), Ext.Date.MINUTE, age), 'F j, Y, g:i a').toString();
                        }
                        else {
                            return null;
                        }
                    }
                }
            ]
        });
         
         }
        //  else{
        //     this.grid.reconfigure(_store);
        //  }
    }

});
