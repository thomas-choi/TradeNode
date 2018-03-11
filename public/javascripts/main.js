var App = (function(){
	
	// ------------------- Private Members ---------------------
	
	var socket = io.connect();	// client socket of Socket.IO
	var chart;					// Chart
	var simuGrid;				// Grid of simulation window 
	var orderGrid;				// Grid of order book
	
	// ------------------- Private Methods ---------------------
	
	function initDialogs() {
		// initialize the popup window for Settings
		$('#dialog-sim-params').dialog({
			width: 350,
			height: 400,
			resizable: false,
			autoOpen: false,
			modal: true,
			buttons: {
				// OK button click handler
				"OK": function() {
					// get values of simulation setting
					var straParam = {};
					$(this).find('form.settings-form :input').each(function(){
						straParam[this.name] = $(this).val();
					});

					// get simulation data type and date
                    var type = $(this).find('ul.ds-settings :radio[name=dataSource]:checked').val();
					var date = (type == 'sim' ? $('input#ds-datepicker').val() : null);
                    var sysData = { type: type, simdate: date };
                    
                    // send 'setup' event to the realtime server
					socket.emit('setup', straParam, sysData);
                    
					// close the dialog
					$(this).dialog('close');
				},
				
				// Cancel button click handler
				"Cancel": function(){
					// just close the dialog
					$(this).dialog('close');
				}
			}
		});
		
		// create the date picker for Settings window
		$('#ds-datepicker').datepicker({
			// once select a date from the datepicker,
			// then make the "Simulation Data" as checked 
            onSelect: function(dateText, inst) {
                $('input#ds-simudata').attr('checked', true);
            }
        });
	}
	
	/**
	 * get the chart series instance by sName
	 */
	function findSeriesByName(series, name) {
		var s = null;
		for (var i = 0, len = series.length; i < len; i++) {
			var tmp = series[i];
			if (tmp.name == name) {
				s = tmp;
				break;
			}
		}
		return s;
	}
	
	function initChart() {
		Highcharts.setOptions({ global: { useUTC: false }});
		
		chart = new Highcharts.Chart({
			title: { text: '' },
			legend: { enabled: true },
			exporting: { enabled: false },
			tooltip: {
				formatter: function() {
		        	return '<b>' + this.series.name + '</b><br/>'
                        + Highcharts.dateFormat('%Y/%m/%d %H:%M:%S', this.x) + '<br/>'
                        + Highcharts.numberFormat(this.y, 2) + '<br/>'
                        + 'Note:' + this.point.note;
				}
			},
			chart: {
				renderTo: 'chart-container',
				defaultSeriesType: 'spline',
				marginRight: 10,
				height: 280,
				zoomType: 'x',	// enable the zoom feature of the chart (zoom on x-axis)
				events: {
					load: function() {
						var self = this;
						
						// listening the server-side event 'chart' 
						// and receive the data to draw the chart
						socket.on('chart', function(data) {
							var sName = data.sName;
							var chartName = data.chartName;
							var x = data.xtime;
							var y = data.yvalue;
							var note = data.note || '';
                            
							// if find the series that is created previously,
							// then add the new point to this series. 
							// otherwise, create a new series and add the point to it. 
							var s = findSeriesByName(self.series, chartName) || self.addSeries({ 
								name: chartName, data: []
							}, true, true);
							
							if (note.indexOf('*-') == 0) {
							    note = note.substr(2);
							    s.addPoint({x:x, y:y, note:note, color:'#BF0B23'});
							} else {
							    s.addPoint({x:x, y:y, note:note});
							}
						});
					}
				}
			},
			xAxis: { type: 'datetime', tickPixelInterval: 150 },
			yAxis: { title: { text: 'Value' }, plotLines: [{ value: 0, width: 1, color: '#808080' }] }
		});
	}
	
	/**
	 * Handle click event from the button group in simulation window grid
	 */
	function commandHandler(command, grid, idd, idx) {
		var sName = grid.cells(idd, 0).getValue();
		
		// if settting button clicked
		if (command == 'setting') {
			var row = grid.getRowById(idd);
			var straParam = $(row).data('straParam');
			var dialog = $('#dialog-sim-params');

			// set the sName
			dialog.find('#sp-sname').html(straParam.sName);
			dialog.find('input[name=sName]').val(straParam.sName);
			
			// create the setting form items dynamicly
			dialog.find('table tr:gt(0)').remove();
			
			for (var p in straParam) {
				if (p != 'sName') {
					dialog.find('table').append($([
					    '<tr>',
					        '<td>' + p + '</td>',
					        '<td><input type="text" name="' + p + '" value="' + straParam[p] + '"/></td>',
					    '</tr>'
					].join('')));
				}
			}
			
			// open the setting dialog window
			dialog.dialog('open');
		}
		// other buttons clicked
		else {
			// change the chart title name
			$('#chart-sim-name, #grid-sim-name').html(sName);
			
			//send 'cmd' event to the server
			socket.emit('cmd', { sName: sName, command: command });
		}
	}
	
	function initGrid() {
		// create the simulation window grid
		simuGrid = new dhtmlXGridObject('list-simulator');
		simuGrid.setImagePath("javascripts/dhtmlxGrid/codebase/imgs/");
		simuGrid.setHeader("Simulation Window,Commands,Status,P&L,Float P&L");
		simuGrid.setColTypes("ro,cmds,ro,ro,ro");
		simuGrid.setInitWidths("150,*,100,100,100");
		simuGrid.setColAlign("left,left,center,right,right");
		simuGrid.setSkin("light");
		simuGrid.attachEvent("onCommand", commandHandler);
		simuGrid.init();
		
		// create the order book grid
		orderGrid = new dhtmlXGridObject('gird-container');
		orderGrid.setImagePath("javascripts/dhtmlxGrid/codebase/imgs/");
		orderGrid.setHeader("Order ID,Account,B/S,Symbol,Qty,Price,Filled,Avg Price,Order Type,Status,Ver,Ref,Time,Remark");
		orderGrid.setColSorting("str,str,str,str,int,int,int,int,str,str,int,str,str,str");
		orderGrid.setInitWidths("*,*,40,70,70,70,70,70,80,70,40,70,70,70");
		orderGrid.setColAlign("left,left,center,center,right,right,right,right,center,center,left,left,left,left");
		orderGrid.setSkin("light");
		orderGrid.init();
	}
	
	/**
	 * listening all server-side event from socket.io 
	 */
	function initDataMonitor() {
		// if PnL event is received, then display the 
		// values of totalPnL and totalFloat on the page
		socket.on('PnL', function(data) {
	 	    $('#ttl-pnl').html(data.TotalPnL);
	 	    $('#flt-pnl').html(data.TotalFloat);
	    });
		
		socket.on('strategy', function(data) {
			var straData = data.straData;
			
			var strategyId = straData.sName;
			var row = simuGrid.getRowById(strategyId);
			
			// manipulate the row data
			var rowData = [ strategyId, "0", straData.status, straData.realizedPnL, straData.floatPnL ];
			
			// if simulation already in the grid, then update it. 
			// (remove the old row and create a new one)
			if (row) {
				var rowIdx = simuGrid.getRowIndex(strategyId);
				simuGrid.deleteRow(strategyId);
				row = simuGrid.addRow(strategyId, rowData, rowIdx);
			} 
			// if it is a new simulation, then create a new row
			else {
				row = simuGrid.addRow(strategyId, rowData);
			}
			
			// attach the strategy parameters info to the row
			$(row).data("straParam", data.straParam);
		});
		
		socket.on('ordack', function(data) {
			var id = data.ID;
			
			// manipulate the row data
			var orderData = [ 
			    id, data.account, getBS(data.bs), data.symbol, 
			    data.qty, data.price, data.filled, data.avgPx,
			    getOrderType(data.ordtype), getOrderStatus(data.status), data.ver, data.Ref,
			    data.Time, data.remark
			];
			
			// if ID value exist
			if (id) {
				var row = orderGrid.getRowById(id);
				
				// row exist in order book grid, update it
				if (row) {
					var rowIdx = orderGrid.getRowIndex(id);
					orderGrid.deleteRow(id);
					row = orderGrid.addRow(id, orderData, rowIdx);
				} 
				// row not exist, create a new one
				else {
					row = orderGrid.addRow(id, orderData);
				}
			} 
			// if ID value not exist, create a new row which use the current timestamp as row id
			else {
				var uid = $.now();
				orderData[0] = uid;
				orderGrid.addRow(uid, orderData);
			}
		});
		
		socket.on('ClearOB', function(){
			// remove all rows in order book grid
			orderGrid.clearAll();
		});
		
		socket.on('ClearChart', function(){
			// remove all chart series
			$(chart.series).each(function(){
				var self = this;
				setTimeout(function() { self.remove(); }, 100);
			});
		});
	}
	
	/**
	 * convert Buy/Sell flag to display string
	 */
	function getBS(v) {
		switch (v) {
			case -1: return "B";
			case 1: return "S";
			case 0: return "UNDE";
		}
	}
	
	/**
	 * convert order type value to display string
	 */
	function getOrderType(v) {
		switch (v) {
			case 0: return "UNDE";
			case 1: return "PEND";
			case -1: return "REJE";
			case 3: return "COMP";
			case 4: return "CANC";
		}
	}
	
	/**
	 * convert order status value to display string
	 */
	function getOrderStatus(v) {
		switch (v) {
			case 0: return "LMT";
			case 1: return "MKT";
		}
	}
	
	// ------------------- Public Methods ---------------------
	return {
		init: function() {
			initDialogs();
			initGrid();
			initChart();
			initDataMonitor();
		}
	};
})();

// start point
$(App.init);
