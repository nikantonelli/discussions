Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    
launch: function() {
    var that =  this;
    var minutesInDay = 1440;
    var daysToSee = 14;

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
	    fetch: ['FormattedID','TargetDate', 'Discussion', 'LatestDiscussionAgeInMinutes','LastUpdateDate', 'Name', 'State', 'ScheduleState', 'Owner', 'PlanEstimate'],
	    filters: this._filters,
	    listeners: {
		load: that._onArtifactsLoaded,
		scope:this
	    }
   	});

   },
   _onArtifactsLoaded: function(store,data){
        store.sort( {
            property: 'LatestDiscussionAgeInMinutes',
            direction: 'ASC'
        });
        this._createGrid(store.getRecords());
   },
   
   _createGrid: function(data) {

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
                    if ((record.get('lastPost') === undefined) && (record.get('Discussion').Count > 0)) {

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
    }

});
