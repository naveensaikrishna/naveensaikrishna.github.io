'use strict';


// Wrap everything in an anonymous function to avoid polluting the global namespace
(function () {
  $(document).ready(function () {

    tableau.extensions.initializeAsync().then(function () {
      // Since dataSource info is attached to the worksheet, we will perform
      // one async call per worksheet to get every dataSource used in this
      // dashboard.  This demonstrates the use of Promise.all to combine
      // promises together and wait for each of them to resolve.
      let dataSourceFetchPromises = [];
      let underlyingTablesDataPromises = [];

      // Maps dataSource id to dataSource so we can keep track of unique dataSources.
      let dashboardDataSources = {};
      let worksheetsArr = [];
      let dataSourceArr = []

      // To get dataSource info, first get the dashboard.
      const dashboard = tableau.extensions.dashboardContent.dashboard;

      // Then loop through each worksheet and get its dataSources, save promise for later.
      dashboard.worksheets.forEach(function (worksheet) {

        dataSourceFetchPromises.push(worksheet.getDataSourcesAsync());
        worksheetsArr.push(worksheet);
      });

      Promise.all(dataSourceFetchPromises).then( (dataSources) => {
        
        //alert("DS " + dataSources.length)
        let data = {};
        dataSources.forEach(function (dataSource,i) {

          dataSource.forEach( (d,j)=> {
            underlyingTablesDataPromises.push(d.getUnderlyingDataAsync())
            dataSourceArr.push(d.name)
          })
          
        });

           
        Promise.all(underlyingTablesDataPromises).then( (dataTables) => {
     
          let data = {};
          dataTables.forEach( (d,i) => {
            data[dataSourceArr[i]] = d
          })

          let full_data = {}
            
          for(let key in data) {

            full_data[key] = [];

            data[key]["_data"].forEach( (row,i) => {
              let obj = {}

              data[key]["_columns"].forEach( (col,j) => {
                obj[col._fieldName] = row[j]._value
              })

              full_data[key].push(obj)
            })
          } 

          //alert("FD "+JSON.stringify(full_data))
          chart(full_data)
        }) 
      })
    }, function (err) {
      // Something went wrong in initialization.
      console.log('Error while Initializing: ' + err.toString());
    });
  });

  // Refreshes the given dataSource.
  function refreshDataSource (dataSource) {
    dataSource.refreshAsync().then(function () {
      console.log(dataSource.name + ': Refreshed Successfully');
    });
  }

  // Displays a modal dialog with more details about the given dataSource.
  function showModal (dataSource) {
    let modal = $('#infoModal');

    $('#nameDetail').text(dataSource.name);
    $('#idDetail').text(dataSource.id);
    $('#typeDetail').text((dataSource.isExtract) ? 'Extract' : 'Live');

    // Loop through every field in the dataSource and concat it to a string.
    let fieldNamesStr = '';
    dataSource.fields.forEach(function (field) {
      fieldNamesStr += field.name + ', ';
    });

    // Slice off the last ", " for formatting.
    $('#fieldsDetail').text(fieldNamesStr.slice(0, -2));

    dataSource.getConnectionSummariesAsync().then(function (connectionSummaries) {
      // Loop through each connection summary and list the connection's
      // name and type in the info field
      let connectionsStr = '';
      connectionSummaries.forEach(function (summary) {
        connectionsStr += summary.name + ': ' + summary.type + ', ';
      });

      // Slice of the last ", " for formatting.
      $('#connectionsDetail').text(connectionsStr.slice(0, -2));
    });

    dataSource.getActiveTablesAsync().then(function (activeTables) {
      // Loop through each table that was used in creating this datasource
      let tableStr = '';
      activeTables.forEach(function (table) {
        tableStr += table.name + ', ';
      });

      // Slice of the last ", " for formatting.
      $('#activeTablesDetail').text(tableStr.slice(0, -2));
    });

    modal.modal('show');
  }

  // Constructs UI that displays all the dataSources in this dashboard
  // given a mapping from dataSourceId to dataSource objects.
  function buildDataSourcesTable (dataSources) {
    // Clear the table first.
    $('#dataSourcesTable > tbody tr').remove();
    const dataSourcesTable = $('#dataSourcesTable > tbody')[0];

    // Add an entry to the dataSources table for each dataSource.
    for (let dataSourceId in dataSources) {
      const dataSource = dataSources[dataSourceId];


      let newRow = dataSourcesTable.insertRow(dataSourcesTable.rows.length);
      let nameCell = newRow.insertCell(0);
      let refreshCell = newRow.insertCell(1);
      let infoCell = newRow.insertCell(2);

      let refreshButton = document.createElement('button');
      refreshButton.innerHTML = ('Refresh Now');
      refreshButton.type = 'button';
      refreshButton.className = 'btn btn-primary';
      refreshButton.addEventListener('click', function () { refreshDataSource(dataSource); });

      let infoSpan = document.createElement('span');
      infoSpan.className = 'glyphicon glyphicon-info-sign';
      infoSpan.addEventListener('click', function () { showModal(dataSource); });

      nameCell.innerHTML = dataSource.name + "HERE";
      refreshCell.appendChild(refreshButton);
      infoCell.appendChild(infoSpan);
    }
  }
})();
