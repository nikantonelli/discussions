Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    
launch: function() {

    var minutesInDay = 1440;
    var daysToSee = 14;

    this._filters = [
            {
            property : 'LastUpdateDate',
            operator : '>=',
            value : Ext.Date.subtract(new Date(), Ext.Date.MINUTE, minutesInDay * daysToSee)
            
        }	
    ];

    this._loadModels().then({
        success: this._getStore,
        scope: this
    });
},

_loadModels: function() {
    var deferred = Ext.create('Deft.Deferred');

    Ext.create('Rally.data.wsapi.Store', {
        context: this.getContext().getDataContext(),
        autoLoad: true,
        remoteFilter: true,
        model: Ext.identityFn('TypeDefinition'),
        sorters: {
            property: 'Ordinal',
            direction: 'Desc'
        },
        filters: [
            {
                property: 'Parent.Name',
                operator: '=',
                value: 'Portfolio Item'
            },
            {
                property: 'Creatable',
                operator: '=',
                value: 'true'
            }
        ],
        listeners : {
            load: function(store, records, success) {
                if (success) {
                    deferred.resolve(records);
                }
                else {
                    deferred.reject(null);
                }
            }
        }
    });

    return deferred.promise;
},

_getStore: function(records){
    var that =  this;  
    var modelList = ['UserStory', 'Defect', 'Task' ];

    _.each(records, function (record) {
        modelList.push(record.get('TypePath'));
    });

    Ext.create('Rally.data.wsapi.artifact.Store',{
        models: modelList,
        context: that.getContext().getDataContext(),
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
            property: 'LastUpdateDate',
            direction: 'DESC'
        });
        this._createGrid(store.getRecords());
   },
   
   _createGrid: function(data) {

        _store = Ext.create('Rally.data.custom.Store', {
                data: data,
//                groupField: 'FormattedID',
                pageSize: 100
            });
        if (!this.grid) {
        this.grid = this.add({
            margin: 20,
            xtype: 'rallygrid',
            itemId: 'mygrid',
            store: _store,
            collapsible: true,

            /**
             * Because this is a custom store, none of the field helpers are available. If it is not provided in the right way
             * then we need to provide our own renderers.
             */

            columnCfgs: [
                {
                   text: 'Artifact', dataIndex: 'FormattedID'
                },
                {text: 'Title', dataIndex: 'Name', flex: 1},
                {text: 'Owner', dataIndex: 'Owner', renderer: function(cellvalue, cell, record, idx, count, store, grid) {
                        if (record && record.get('Owner')) {
                            return record.get('Owner')._refObjectName;
                        }
                        else {
                            return '';
                        }
                    }
                },
                {text: 'Last Artefact Update', dataIndex: 'LastUpdateDate', xtype: 'datecolumn', format: 'F j, Y, g:i a'},
                {text: 'State', dataIndex: 'ScheduleState', renderer: function(cellvalue, cell, record, idx, count, store, grid) {
                        if (record && record.hasField('ScheduleState')) {
                            return record.get('ScheduleState');
                        }
                        else if (record && record.hasField('State') && record.get('State')) {
                            return record.get('State').Name;
                        }
                        else {
                            return '';
                        }
                    }
                },
                // {
                //     text: 'Plan Estimate', 
                //     dataIndex: 'PlanEstimate',
                // },
                {text: 'Last Post', flex: 2, dataIndex: 'lastPost', renderer: function(cellvalue, cell, record, idx, count, store, grid) {
                    if ((record.get('lastPost') === undefined) && (record.get('Discussion').Count > 0)) {

                        record.getCollection('Discussion').load({
                            fetch: ['Text', 'CreationDate', 'User'],
                            sorters: [
                                {
                                    property: 'CreationDate',
                                    direction: 'DESC'
                                }
                            ],
                            callback: function (records, operation, success) {
                                if (success) {
                                    record.set('lastPost', records[0].get('Text'));   //If we have ordered the right way, we will have the latest first.
                                    record.set('AddedBy', records[0].get('User'));
                                }else {
                                    record.set('lastPost','');
                                    record.set('AddedBy', '');
                                }
                            }
                        });
                        return 'Fetching..';
                    } else {
                        return record.get('lastPost');
                    }
                }},
                {text: 'Last Post Date', dataIndex: 'LatestDiscussionAgeInMinutes', renderer: function(age) {
                        if (age) {
                            return Ext.Date.format(Ext.Date.subtract(new Date(), Ext.Date.MINUTE, age), 'F j, Y, g:i a').toString();
                        }
                        else {
                            return null;
                        }
                    }
                },
                {text: 'Added By', dataIndex: 'AddedBy', renderer: function(cellvalue, cell, record, idx, count, store, grid) {
                    return (record && record.get('AddedBy'))?record.get('AddedBy')._refObjectName: '';
                }}
            ]
        });
         
         }
    }

});
