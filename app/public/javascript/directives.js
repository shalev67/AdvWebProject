(function() {
    'use strict';
    var myApp = angular.module('myApp');

    myApp.directive('goDiagram', ['$http', function($http) {
      return {
        restrict: 'E',
        template: '<div style="direction:rtl"></div>',  // just an empty DIV element
        replace: true,
        scope: { model: '=goModel' },
        link: function(scope, element, attrs) {
            // var $ = go.GraphObject.make;

          var myDiagram = go.GraphObject.make(go.Diagram, element[0], // must be the ID or reference to div
                {
                  initialContentAlignment: go.Spot.Center,
                  // make sure users can only create trees
                  validCycle: go.Diagram.CycleDestinationTree,
                  // users can select only one part at a time
                  maxSelectionCount: 1,
                  layout:
                    go.GraphObject.make(go.TreeLayout,
                      {
                        treeStyle: go.TreeLayout.StyleLastParents,
                        arrangement: go.TreeLayout.ArrangementHorizontal,
                        // properties for most of the tree:
                        angle: 90,
                        layerSpacing: 50,
                        nodeSpacing: 50,
                        // properties for the "last parents":
                        alternateAngle: 90,
                      }),
                });

            myDiagram.isReadOnly = true;
            myDiagram.isEnabled = false;

            var levelColors = ["#AC193D", "#2672EC", "#8C0095", "#5133AB",
                               "#008299", "#D24726", "#008A00", "#094AB2"];

            // override TreeLayout.commitNodes to also modify the background brush based on the tree depth level
            myDiagram.layout.commitNodes = function() {
              go.TreeLayout.prototype.commitNodes.call(myDiagram.layout);  // do the standard behavior
              // then go through all of the vertexes and set their corresponding node's Shape.fill
              // to a brush dependent on the TreeVertex.level value
              myDiagram.layout.network.vertexes.each(function(v) {
                if (v.node) {
                  var level = v.level % (levelColors.length);
                  var color = levelColors[level];
                  var shape = v.node.findObject("SHAPE");
                  if (shape) shape.fill = go.GraphObject.make(go.Brush, "Linear", { 0: color, 1: go.Brush.lightenBy(color, 0.2), start: go.Spot.Left, end: go.Spot.Right });
                }
              });
            };

            // This function provides a common style for most of the TextBlocks.
            // Some of these values may be overridden in a particular TextBlock.
            function textStyle() {
              return { font: "13pt sans-serif", stroke: "white" };
            }

            function nameStyle() {
              return { font: "bold 16pt sans-serif", stroke: "white" };
            }

            // define the Node template
            myDiagram.nodeTemplate =
              go.GraphObject.make(go.Node, "Auto",
                // for sorting, have the Node.text be the data.name
                new go.Binding("text", "name"),
               
                // define the node's outer shape
                go.GraphObject.make(go.Shape, "RoundedRectangle",
                  {
                    name: "SHAPE",
                    // fill: graygrad, 
                    stroke: "black",
                    // margin: -10,
                    portId: "", fromLinkable: true, toLinkable: true, cursor: "pointer"
                  }),
                // define the panel where the text will appear
                go.GraphObject.make(go.Panel, "Table",
                  {
                    maxSize: new go.Size(500, 999),
                    margin: new go.Margin(10, 10, 10, 10),
                    // defaultAlignment: go.Spot.Center
                  },
                  go.GraphObject.make(go.RowColumnDefinition, { column: 2, width: 4 }),
                  go.GraphObject.make(go.Panel, go.Panel.Auto,
                    { row: 0, column: 0, columnSpan: 5 },
                    { visible: false },
                    go.GraphObject.make(go.TextBlock, nameStyle(),  // the name
                      {
                        // row: 0, column: 0, columnSpan: 5,
                        isMultiline: true,
                        minSize: new go.Size(10, 14),
                        textAlign: "center",
                        alignment: go.Spot.Right
                        
                      },
                      new go.Binding("text", "name", function(s) { return (s) ? "שם בית העסק: " + s : "" })),
                      new go.Binding("visible", "name", function(s) { if (s) return true; else return false; })),
                  go.GraphObject.make(go.Panel, go.Panel.Auto,
                    { visible: false, row: 2, column: 0, columnSpan: 5 },
                    go.GraphObject.make(go.TextBlock, textStyle(), // the counter
                      {
                        font: "16pt sans-serif",
                        // row: 1, 
                        // column: 1, columnSpan: 5,
                        isMultiline: true,
                        stroke: "gold",
                        textAlign: "right",
                        // minSize: new go.Size(10, 14),
                        // margin: new go.Margin(0,10,0,3)

                        
                      },
                      new go.Binding("text", "counter")),
                      new go.Binding("visible", "counter", function(s) { if (s) return true; else return false; })),
                      // new go.Binding("row", "counter", function(s) { if (s) return 1; else return 0;})
                  go.GraphObject.make(go.Panel, go.Panel.Auto,
                    { visible: false, row: 1, column: 0, columnSpan: 5 },
                    go.GraphObject.make(go.TextBlock, textStyle(),
                      {
                        // row: 1, column: 0, columnSpan: 4,
                        isMultiline: false,
                        minSize: new go.Size(10, 14),
                        alignment: go.Spot.Center,
                        // margin: new go.Margin(0, 0, 0, 3)
                      },
                      new go.Binding("text", "category", function(s) { return (s) ? "קטגוריה: " + s : ""})),
                      new go.Binding("visible", "category", function(s) { if (s) return true; else return false; })),
                  
                )  // end Table Panel
              );  // end Node

            // define the Link template
            myDiagram.linkTemplate =
              go.GraphObject.make(go.Link, go.Link.Orthogonal,
                { corner: 5, relinkableFrom: true, relinkableTo: true },
                go.GraphObject.make(go.Shape, { strokeWidth: 3 }),
                go.GraphObject.make(go.TextBlock,
                  new go.Binding("text", "text"),
                  { stroke: "black", background: "white",
                    maxSize: new go.Size(80, NaN),
                    font: "bold 13pt sans-serif",
                  }));  // the link shape

              scope.$watch("model", function(newmodel) {
                if (newmodel !== undefined) {
                    myDiagram.model = newmodel;
                }
              });
        },
        controller:function($scope){
            var hebrew_month_names = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר']
            var d = new Date();
            var lastMonth = d.getMonth() - 1;
            var currYear = d.getFullYear();
            var treeUrl = "http://localhost:3001/decisionTree" + "?month=" + lastMonth + "&year=" + currYear;

            $scope.$parent.month = hebrew_month_names[lastMonth - 1];
            $scope.$parent.year = currYear; 

            $http({method: 'GET', url:treeUrl}).then(function (treeData) {
                           if (treeData.data !== "None") {
                             var graphModel = new go.GraphLinksModel();
                             graphModel.nodeDataArray = treeData.data.tree.nodeDataArray;
                             graphModel.linkDataArray = treeData.data.tree.linkDataArray;
                             $scope.model = graphModel;
                             // $scope.$parent.month = treeData.data.month;
                             // $scope.$parent.year = treeData.data.year; 
                             $scope.$parent.empty = false;  
                           }
                           else {
                             $scope.$parent.empty = true;
                           }                         
                        }, function (result) {
                            alert("Error: No data returned");
                        });
        }
      };
    }])
    /*
     A directive to enable two way binding of file field
     */
    myApp.directive('demoFileModel', function ($parse) {
        return {
            restrict: 'A', //the directive can be used as an attribute only

            /*
             link is a function that defines functionality of directive
             scope: scope associated with the element
             element: element on which this directive used
             attrs: key value pair of element attributes
             */
            link: function (scope, element, attributes) {
                element.bind("change", function (changeEvent) {
                    var reader = new FileReader();
                    reader.onload = function (loadEvent) {
                        scope.$apply(function () {
                            scope.myFile = loadEvent.target.result;
                        });
                    }
                    try {
                        var fs = reader.readAsDataURL(changeEvent.target.files[0]);
                    }
                    catch (err)
                    {

                    }
                });
            }


            // link: function (scope, element, attrs) {
            //     var model = $parse(attrs.demoFileModel),
            //         modelSetter = model.assign; //define a setter for demoFileModel
            //
            //     //Bind change event on the element
            //     element.bind('change', function () {
            //         //Call apply on scope, it checks for value changes and reflect them on UI
            //         scope.$apply(function () {
            //             //set the model value
            //             modelSetter(scope, element[0].files[0]);
            //         });
            //     });
            // }
        };
    });
})();
