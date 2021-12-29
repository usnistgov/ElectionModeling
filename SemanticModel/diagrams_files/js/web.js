/**
 * Contains functions for Web Publisher 2.0
 * 
 * @author Siri Chongasamethaworn (siri_c@nomagicasia.com)
 * @version 1.1 March 17, 2008
 */
var usecontextmenu = false;
var showappearsinpage = true;
var displayelementid = false;
var displayelementnumber = false;
var showAppliedStereotypes = false;
var gotoLinkByIcon = false;
var selecthistorynode = true; // turn off to improve performance on very large report.
var nonamedNode = '< >';
var nonamedLink = '';
var gotoElementId = '';
var relationshipPath = '';
var hexadecimalName = false;
var appliedStereotyeGroupName = 'report_appliedStereotype_tags';
var resourcesLocation = contextPath;
var currentNodeToExpand;
var favoriteElements = new Array();
var showFavoriteBtn;

var selectedNode;

var containmentT = {id:"containment", treeId:"tree", tabIndex: "0", tabid: "0"};
var diagramT = {id:"diagrams", treeId:"dtree", tabIndex: "1", tabid: "1"};
var tabs = [containmentT, diagramT]; // sort by index
var activeTabStack = ["containment"];// sort by opened index
var tabNumber = 2;
var activeTab;
var skipUpdateCollapseBtn;

if (resourcesLocation != '' && !/\/$/.test(resourcesLocation)) {
	resourcesLocation = resourcesLocation + '/';
}
Library.load({
	'js/animate.js' : [ 'Graphics', 'Content' ]
});
Library.load({
	'js/cookies.js' : [ 'Cookies' ]
});
Library.load({
	'js/map.js' : [ 'MC' ]
});
Content.imgShow = resourcesLocation + 'images/down_triangle.gif';
Content.imgHide = resourcesLocation + 'images/right_triangle.gif';
addEvent(window, 'load', repaint);
addEvent(window, 'load', initWeb);
addEvent(window, 'resize', function() {
	resize();
});
var tree;
var diagramsTree;
var viewbar;
var actionbar;
var currentPageId;

var backStack = new Stack();
var forwardStack = new Stack();

var documentMap = new MC.Map();

var documentation;
var firstShow;

var propertiesMode;
var propertiesRendered = false;

var gotoElementArray = new Array();

function resize() {
	var splitpane = document.getElementById('splitpane');
	splitPane.repaint();
}

function repaint() {
	var divs = document.getElementsByTagName('div');
	for ( var i = 0; i < divs.length; i++) {
		var className = divs[i].className + ' ';
		if (className.indexOf("thead") != -1) {
			var headerText = divs[i].innerHTML;
			var contentNode = nextSibling(divs[i]);
			if (divs[i].hasChildNodes() && contentNode.id) {
				if (divs[i].childNodes[0].nodeName != 'IMG') {
					var img = document.createElement('img');
					img.className = 'nm-content';
					img.src = Content.imgShow;
					img.alt = '';
					img.style.margin = '.1em';
					img.contentId = contentNode.id;
					img.onclick = function() {
						Content.showHide(this, this.contentId);
					};
					divs[i].insertBefore(img, divs[i].childNodes[0]);
				}
			}
		}
	}
	splitPane.repaint();
}

function initWeb() {
	var nav = new Navigator();
	nav.menuLeftImg = 'url(\"' + resourcesLocation + 'images/navigator/containment_left.gif\")';
	nav.menuLeftOverImg = 'url(\"' + resourcesLocation + 'images/navigator/containment_left_over.gif\")';
	nav.menuRightImg = 'url(\"' + resourcesLocation + 'images/navigator/containment_right.gif\")';
	nav.menuRightOverImg = 'url(\"' + resourcesLocation + 'images/navigator/containment_right_over.gif\")';
	nav.repaint();
	var splitpane = document.getElementById('splitpane');
	if (splitpane) {
		var containmentButton = nav.getMenuLeftIcon();
		containmentButton.id = 'containmentButton';
		var cell = splitpane.rows[0].insertCell(0);
		cell.id = 'menupane';
		cell.style.verticalAlign = 'top';
		cell.appendChild(containmentButton);
		/*var containmentButtonWidth = ((containmentButton.offsetWidth / splitpane.offsetWidth) * 100);
		cell.style.width = containmentButtonWidth + '%';*/
		cell.style.width = containmentButton.offsetWidth + 'px';
	}

	var expIcon = document.getElementById('expand_icon');
	if (expIcon) {
		expIcon.appendChild(nav.getUnDockIcon());
		expIcon.appendChild(nav.getMinimizeIcon());
	}

	var titlebar = document.getElementById('titlebar');
	var content = document.getElementById('splitpane-second');
	if (content != null && titlebar != null) {
		if (document.documentElement.clientHeight)
			content.style.height = document.documentElement.clientHeight - titlebar.offsetHeight + 'px';
		else
			content.style.height = window.innerHeight - titlebar.offsetHeight + 'px';
	}
	if (Cookies.getCookie('Navigator.pin') == 'false')
		nav.togglePin(false);
}

/**
 * Listener for click on containment tree tab. (Enable containment tree tab content and disabled diagrams tree tab
 * content.)
 */
function showContainmentTab(showCurrentSelectedNode, id) {

	var tabId = "containment_tab";
	var contentId = 'containment_content';
	var toolId = 'containment_tool';
	if (id) {
		tabId = id + '_tab';
		contentId = id + '_content';
		toolId = id + '_tool';
	}
	else {
		id = "containment";
	}

	var containmentTab = document.getElementById(tabId);
	containmentTab.classList.remove('active');
	containmentTab.classList.add('active');

	var containmentContent = document.getElementById(contentId);
	containmentContent.style.display = 'block';

	var containmentTool = document.getElementById(toolId);
	containmentTool.style.display = 'block';

	activeTab = containmentTab;
	removeArray(activeTabStack, id);
	activeTabStack.push(id);

	var selectedNodeInTab;
	for (var i = 0; i < tabs.length; i++) {
		var id = tabs[i].id;
		var otherTabId = id + "_tab";
		var otherContentId = id + '_content';
		var otherToolId = id + '_tool';

		if (otherTabId != tabId) {
			var otherTab = document.getElementById(otherTabId);
			otherTab.classList.remove('active');

			var otherContent = document.getElementById(otherContentId);
			otherContent.style.display = 'none';

			var otherTool = document.getElementById(otherToolId);
			otherTool.style.display = 'none';
		} else {
			selectedNodeInTab = tabs[i].selectedNode;
		}
	}

	if (showCurrentSelectedNode && typeof selectedNodeInTab != 'undefined' && selectedNodeInTab != null) {
		var anchorN = selectedNodeInTab.querySelector("a[name=anchorNode]");
		setHighlightNode(anchorN, selectedNodeInTab);

		var refid = selectedNodeInTab.getAttribute("refid");
		var isCustomModel = Boolean(selectedNodeInTab.mr_isCustomModel);
		if (!isCustomModel) {
			var content = document.getElementById("content");
			var model = content.model;

			if (refid && refid != model)
				showSpec(refid, false, true);
		}
		else {
		    clearDocumentationTab();
            clearPropertiesTab();
		}
	}

	updateCloseBtn();
}

function removeArray(arr, value) {
	for( var i = 0; i < arr.length; i++){
        if ( arr[i] == value) {
            arr.splice(i, 1);
        }
    }
}

/**
 * Listener for click on diagrams tree tabs. (Enable diagrams tree tab content and disabled containment tree tab
 * content.)
 */
function showDiagramsTab(showCurrentSelectedNode) {

	var tabId = "diagrams_tab";
	var contentId = 'diagrams_content';
	var toolId = 'diagrams_tool';

	// Enable diagrams tree tab content.
	var diagramsTab = document.getElementById(tabId);
	diagramsTab.classList.remove('active');
	diagramsTab.classList.add('active');

	var diagramsContent = document.getElementById(contentId);
	diagramsContent.style.display = 'block';

	var diagramsTool = document.getElementById(toolId);
	diagramsTool.style.display = 'block';

	activeTab = diagramsTab;
	removeArray(activeTabStack, "diagrams");
	activeTabStack.push("diagrams");

	var selectedNodeInTab;
	for (var i = 0; i < tabs.length; i++) {
		var id = tabs[i].id;
		var otherTabId = id + "_tab";
		var otherContentId = id + '_content';
		var otherToolId = id + '_tool';

		if (otherTabId != tabId) {
			var otherTab = document.getElementById(otherTabId);
			otherTab.classList.remove('active');

			var otherContent = document.getElementById(otherContentId);
			otherContent.style.display = 'none';

			var otherTool = document.getElementById(otherToolId);
			otherTool.style.display = 'none';
		} else {
			selectedNodeInTab = tabs[i].selectedNode;
		}
	}

	// If diagrams tree does not existed, create the diagrams tree.
	if (diagramsTree == null) {
		XMLRequest.send(resourcesLocation + 'xml/diagrams_tree/diagrams.xml', function(responseXML) {
			if (responseXML) {
				showLoading();
				var root = document.createElement('ul');
				root.className = 'nm-content';
				root.id = 'dtree';
				diagramsTree = new Tree(root.id);
				diagramsTree.image.plus = resourcesLocation + 'images/tree/plus.gif';
				diagramsTree.image.minus = resourcesLocation + 'images/tree/minus.gif';
				diagramsTree.root = root;
				var dataModel = firstChild(responseXML);
				var node = addGroupNode(root, dataModel.getAttribute('name'), dataModel, resourcesLocation
					+ 'images/package.gif');
				node.data = dataModel;
				node.setAttribute('refid', dataModel.getAttribute('refid'));
				buildDiagramsTree(node);
				var browser = document.getElementById('diagrams_content');
				browser.appendChild(root);
				diagramsTree.expand(node);
				var ulNode = node.querySelector("ul");
				if (ulNode)
					node.isExpanded = true;
				diagramT["tree"] = diagramsTree;
				hideLoading();
			}
		}, false, true);
	} else {
		if (showCurrentSelectedNode && typeof selectedNodeInTab != 'undefined' && selectedNodeInTab != null) {

			var anchorN = selectedNodeInTab.querySelector("a[name=anchorNode]");
			setHighlightNode(anchorN, selectedNodeInTab);

			var isCustomModel = Boolean(selectedNodeInTab.mr_isCustomModel);
			if (!isCustomModel) {
				var refid = selectedNodeInTab.getAttribute("refid");
				var content = document.getElementById("content");
				var model = content.model;

				if (refid && refid != model)
					showSpec(refid, false, true);
			}
			else {
			    clearDocumentationTab();
                clearPropertiesTab();
			}
		}
	}

	updateCloseBtn();
}

function activeDocumentationTab() {
	// Enable documentation tab content.
	var docutmentationTab = document.getElementById('documentation_tab');
	docutmentationTab.classList.remove('active');
	docutmentationTab.classList.add('active');
	var documentationContent = document.getElementById('documentation_content');
	documentationContent.style.display = 'block';

	// Disable properties tab content.
	var propertiesTab = document.getElementById('properties_tab');
	propertiesTab.classList.remove('active');
	var propertiesContent = document.getElementById('properties_content');
	propertiesContent.style.display = 'none';
}

function activePropertiesTab() {
	// Enabled properties tab content.
	var propertiesTab = document.getElementById('properties_tab');
	propertiesTab.classList.remove('active');
	propertiesTab.classList.add('active');
	var propertiesContent = document.getElementById('properties_content');
	propertiesContent.style.display = 'block';

	// Disable documentation tab content.
	var docutmentationTab = document.getElementById('documentation_tab');
	docutmentationTab.classList.remove('active');
	var documentationContent = document.getElementById('documentation_content');
	documentationContent.style.display = 'none';
}

function clearDocumentationTab() {
	var name  = document.getElementById('documentation_name_inner');
	name.innerHTML = "Documentation";

	var content  = document.getElementById('documentation_content_div');
	while (content.firstChild) {
		//content.firstChild.remove();
		content.removeChild(content.firstChild);
	}
}

function clearPropertiesTab() {
	var content  = document.getElementById('properties_content_div');
	while (content.firstChild) {
		//content.firstChild.remove();
		content.removeChild(content.firstChild);
	}

	var menu  = document.getElementById('properties_menu_inner');
	while (menu.firstChild) {
		//content.firstChild.remove();
		menu.removeChild(menu.firstChild);
	}
}

function showDocumentationTab(documentNode, humanName) {
	var name  = document.getElementById('documentation_name_inner');
	name.innerHTML = "Documentation of " + humanName;

	var content  = document.getElementById('documentation_content_div');
	while (content.firstChild) {
		//content.firstChild.remove();
		content.removeChild(content.firstChild);
	}
	//content.getBoundingClientRect()
	renderValueNode(content, documentNode, true);
}

function showSpecForProperties(elementId) {
	XMLRequest.send(resourcesLocation + 'xml/' + elementId + '.xml', renderModelForProperties);
}

function renderModelForProperties(responseXML) {
	var magicdraw;
	if (responseXML)
		magicdraw = responseXML.getElementsByTagName('magicdraw')[0];
	if (magicdraw == null) {
		alert('This element was not generated from project.');
		return;
	}
	var model = firstChild(magicdraw);
	showPropertiesTab(model);
}

function showPropertiesTab(model) {
	var mode  = document.getElementById('properties_menu_inner');
	var tabul  = document.getElementById('properties_viewtab');
	if (!tabul)
	{
		tabul = document.createElement('ul');
		tabul.id = 'properties_viewtab';
		tabul.className = 'nm-content tab';
		var modeItem = createPropertiesModeMenu(true);
		tabul.appendChild(modeItem);
		mode.appendChild(tabul);
	}

	var main_content  = document.getElementById('content');
	var content  = document.getElementById('properties_content_div');
	content.model = model;
	removeAll(content);

	// content table
	if (model.hasChildNodes) {
		var table = document.createElement('div');
		table.className = 'nm-content table';
		var tbody = document.createElement('div');
		tbody.id = 'properties_generalTable';
		tbody.className = 'nm-content tbody';
		table.appendChild(tbody);
		content.appendChild(table);
		// peoperties
		var reviewList = new Array();
		var childNodes = getChildNodes(model);
		var doc;
		var humanName = model.getAttribute('humanType');
		for ( var c = 0; c < childNodes.length; c++) {
			if (childNodes[c].tagName == 'name')
			{
				humanName = humanName + " " + nodeValue(childNodes[c]);
			}
			else if (childNodes[c].tagName == 'documentation')
			{
				doc = childNodes[c];
			}
			if (childNodes[c].nodeType == 1) {
				// General Information
				if (childNodes[c].tagName == appliedStereotyeGroupName || childNodes[c].tagName == 'documentation' || childNodes[c].tagName == 'map' || childNodes[c].tagName == 'appearsIn')
					continue;

				var showProperty = false;
				if (content.mode == '')
					showProperty = true;
				else {
					var mode = childNodes[c].getAttribute('mode');
					if (mode)
						showProperty = mode.indexOf(content.mode) >= 0;
				}
				if (showProperty) {
					var row = document.createElement('div');
					row.className = 'nm-content row';
					var innerRow = document.createElement('div');
					innerRow.className = 'nm-content inner';
					var label = document.createElement('label');
					label.className = 'nm-content';
					label.appendChild(document.createTextNode(childNodes[c].getAttribute('humanName')));
					innerRow.appendChild(label);
					var separator = document.createElement('span');
					separator.className = 'nm-content col';
					separator.appendChild(document.createTextNode(' : '));
					innerRow.appendChild(separator);
					var value = document.createElement('span');
					value.className = 'nm-content col';
					if (childNodes[c].firstChild && childNodes[c].firstChild.nodeType == 1) {
						var collections = childNodes[c].childNodes;
						var cdiv = document.createElement('div');
						cdiv.className = 'nm-content none';
						cdiv.id = "properties_" + childNodes[c].getAttribute('humanName');
						if (collections.length > 1) {
							var img = document.createElement('img');
							img.src = Content.imgShow;
							img.alt = '';
							img.className = 'nm-content toggle';
							img.contentId = cdiv.id;
							img.onclick = function() {
								var content = new Content();
								content.imgHide = resourcesLocation + 'images/left_triangle.gif';
								content.showHide(this, this.contentId);
								repaint();
							};
							innerRow.appendChild(img);
							cdiv.classList.add('afterToggle');
							separator.classList.add('withToggle');
						}
						value.appendChild(cdiv);
						for ( var o = 0; o < collections.length; o++) {
							var humanType = collections[o].getAttribute('humanType');
							if (humanType)
								createLink(cdiv, collections[o]);
							else
								renderValueNode(cdiv, collections[o]);
							cdiv.appendChild(document.createElement('br'));
						}
					} else {
						var humanType = childNodes[c].getAttribute('humanType');
						if (humanType)
							createLink(value, childNodes[c]);
						else
							renderValueNode(value, childNodes[c]);
					}
					innerRow.appendChild(value);
					row.appendChild(innerRow);
					tbody.appendChild(row);
				}
			}
		}
		if (doc)
		{
			showDocumentationTab(doc, humanName);
		}
	}
}

function isHiddenNode(node) {
	if (node.nodeType == 1) {
		// do not display hidden element
		var isHidden = node.getAttribute('isHidden');
		if (isHidden == 'true')
			return true;
		return false;
	}
	return true;
}

function buildTree(li, tabid) {
	var model = li.data;
	if (model == null)
		return;
	var hasChild = Boolean(model.getAttribute('hasChild'));
	if (hasChild) {
		var emptyUL = document.createElement('ul');
		emptyUL.className = 'nm-content';
		var nodeID = model.getAttribute('refid');

		var ulDummyID = '';
		var parentULDummyID = li.parentULDummyID;
		if (parentULDummyID)
			ulDummyID = parentULDummyID + '_';

		var model_dummyID = model.getAttribute('dummyid');
		if (model_dummyID)
			ulDummyID = ulDummyID + model_dummyID + '_';

		var ulTabId = "";
		if (tabid)
			ulTabId = "[" + tabid + "]_";

		emptyUL.dummyid = ulTabId + ulDummyID;
		emptyUL.id = 'ul_' + ulTabId + ulDummyID + nodeID;

		emptyUL.setAttribute('refid', nodeID);
		emptyUL.onExpand = function() {
			if (emptyUL.parentNode == selectedNode) {
				updateCollapseRecursiveBtn(emptyUL);
			}
			updateCollapseAllBtn();

			var node = this.parentNode;
			if (this.hasChildNodes()) {
				return;
			}

			var fileName = node.getAttribute('refid');
			currentNodeToExpand = emptyUL.dummyid;
			XMLRequest.send(resourcesLocation + 'xml/tree/' + fileName + '.xml', function(responseXML) {
				if (responseXML) {
					createChild(responseXML, currentNodeToExpand);

					var elementNode = firstChild(responseXML);
					var id = elementNode.getAttribute('refid');
					var parentUL = document.getElementById('ul_' + currentNodeToExpand + id);
					if (parentUL && parentUL.parentNode.onReady) {
						parentUL.parentNode.onReady();
					}
				}
			}, false, true);

		};
		emptyUL.onCollapse = function() {
			if (emptyUL.parentNode == selectedNode) {
				updateCollapseRecursiveBtn(emptyUL);
			}
			updateCollapseAllBtn();
			splitPane.repaint();
		};
		li.appendChild(emptyUL);
		// break;
	}
	// }
	// }
	// }
	tree.renderNode(li);
}

function buildDiagramsTree(li) {
	var model = li.data;
	if (model == null)
		return;
	var hasChild = Boolean(model.getAttribute('hasChild'));
	if (hasChild) {
		var emptyUL = document.createElement('ul');
		emptyUL.className = 'nm-content';
		var nodeID = model.getAttribute('refid');
		emptyUL.id = 'ul_' + nodeID;
		emptyUL.setAttribute('refid', nodeID);
		emptyUL.onExpand = function() {
			if (emptyUL.parentNode == selectedNode) {
				updateCollapseRecursiveBtn(emptyUL);
			}
			updateCollapseAllBtn();

			var node = this.parentNode;
			if (this.hasChildNodes()) {
				return;
			}
			XMLRequest.send(resourcesLocation + 'xml/diagrams_tree/' + nodeID + '.xml', function(responseXML) {
				if (responseXML) {
					createDiagramChild(responseXML);

					var elementNode = firstChild(responseXML);
					var id = elementNode.getAttribute('refid');
					var parentUL = document.getElementById('ul_' + id);
					if (parentUL && parentUL.parentNode.onReady) {
						parentUL.parentNode.onReady();
					}
				}
			}, false, true);

		};
		emptyUL.onCollapse = function() {
			if (emptyUL.parentNode == selectedNode) {
				updateCollapseRecursiveBtn(emptyUL);
			}
			updateCollapseAllBtn();
			splitPane.repaint();
		};
		li.appendChild(emptyUL);
	}
	tree.renderNode(li);
}

function createChild(responseXML, parentULDummyID) {
	var elementNode = firstChild(responseXML);
	var id = elementNode.getAttribute('refid');
	var parentUL = document.getElementById('ul_' + parentULDummyID + id);
	// set attribute createChild to node when node is created.
	parentUL.createChild = true;
	var childNodes = elementNode.childNodes;
	for ( var c = 0; c < childNodes.length; c++) {
		if (childNodes[c].tagName == 'ownedElement') {
			var groupMap = new Array();
			var members = childNodes[c].childNodes;
			for ( var p = 0; p < members.length; p++) {
				if (members[p].nodeType == 1) {
					if (isHiddenNode(members[p]))
						continue;
					var icon = members[p].getAttribute('icon');
					if (members[p].tagName == 'diagram')
					{
						var name;
						if (members[p].getAttribute('name'))
							name = members[p].getAttribute('name');
						else
							name = nonamedNode || nonamedNode == '' ? nonamedNode : members[p].getAttribute('humanType');
						var childNode = addChildNode(parentUL, name, members[p], icon);
						childNode.data = members[p];
						childNode.setAttribute('refid', members[p].getAttribute('refid'));
						tree.renderNode(childNode);
					}
					else
					{
						// display element, icon
						var childNode = null;
						// group relationship
						if (members[p].getAttribute('isRelationship') == 'true') {
							var relationUL;
							if (parentUL.firstChild && parentUL.firstChild.elementName == 'Relations')
								relationUL = parentUL.firstChild.lastChild;
							else {
								var relationLI = addNode(parentUL, 'Relations', 'javascript:void(0);',
                                                                    relationshipPath, 'true', true);
                                relationLI.setAttribute('refid', 'relations');
								relationUL = document.createElement('ul');
								relationUL.className = 'nm-content';
								relationUL.onExpand = function() {
									if (relationUL.parentNode == selectedNode) {
										updateCollapseRecursiveBtn(relationUL);
									}
									updateCollapseAllBtn();
								};
								relationUL.onCollapse = function() {
									if (relationUL.parentNode == selectedNode) {
										updateCollapseRecursiveBtn(relationUL);
									}
									updateCollapseAllBtn();
								};
								relationLI.appendChild(relationUL);
								if (parentUL.firstChild)
									parentUL.insertBefore(relationLI, parentUL.firstChild);
								else
									parentUL.appendChild(relationLI);
								tree.renderNode(relationLI);
							}
							var name = members[p].getAttribute('humanType');
							if (members[p].getAttribute('name'))
								name += ':' + members[p].getAttribute('name');
							childNode = addChildNode(relationUL, name, members[p], icon);
							childNode.data = members[p];
							childNode.setAttribute('refid', members[p].getAttribute('refid'));
						} else {
							var groupBy = members[p].getAttribute('groupBy');
							if (groupBy) {
								if (!groupMap[groupBy])
									groupMap[groupBy] = new Array();
								groupMap[groupBy][groupMap[groupBy].length] = members[p];
							} else {
								var name;
								if (members[p].getAttribute('represents'))
									name = members[p].getAttribute('represents');
								else if (members[p].getAttribute('name'))
									name = members[p].getAttribute('name');
								else
									name = nonamedNode || nonamedNode == '' ? nonamedNode : members[p].getAttribute('humanType');
								childNode = addChildNode(parentUL, name, members[p], icon)
								childNode.data = members[p];
								childNode.setAttribute('refid', members[p].getAttribute('refid'));
								if (groupMap) {
									var childGroup = groupMap[childNode.getAttribute('refid')];
									if (childGroup) {
										var tmpOwnedElement;
										var tmpChildNodes = childNode.data.childNodes;
										for ( var tmp = 0; tmp < tmpChildNodes.length; tmp++) {
											if (tmpChildNodes[tmp].tagName == 'ownedElement') {
												tmpOwnedElement = tmpChildNodes[tmp];
												break;
											}
										}
										if (typeof (tmpOwnedElement) == 'undefined') {
											tmpOwnedElement = createElement('ownedElement');
											tmpOwnedElement.className = 'nm-content';
											childNode.data.appendChild(tmpOwnedElement);
										}
										if (tmpOwnedElement) {
											for ( var g = 0; g < childGroup.length; g++) {
												childGroup[g].removeAttribute('groupBy');
												tmpOwnedElement.appendChild(childGroup[g]);
											}
										}
									}
								}
							}
						}
						if (childNode != null)
							buildTree(childNode);
					}
				}
			}
		}
	}
}

function createDiagramChild(responseXML) {
	var digaramsNode = firstChild(responseXML);
	var id = digaramsNode.getAttribute('refid');
	var parentUL = document.getElementById('ul_' + id);
	parentUL.createChild = true;
	var childNodes = digaramsNode.childNodes;
	for ( var c = 0; c < childNodes.length; c++) {
		var typeNode = childNodes[c];
		var icon = typeNode.getAttribute('icon');

		if (!icon)
			icon = resourcesLocation + 'images/package.gif';
		var name;
		if (typeNode.getAttribute('name'))
			name = typeNode.getAttribute('name');
		else
			name = nonamedNode;
		var childNode;
		if (typeNode.nodeName == 'diagram')
			childNode = addChildNode(parentUL, name, typeNode, icon);
		else
			childNode = addGroupNode(parentUL, name, typeNode, icon);

		childNode.data = typeNode;
		childNode.setAttribute('refid', typeNode.getAttribute('refid'));
		if (childNode != null) {
			buildDiagramsTree(childNode)
		}
	}
}

function findNodeForSelected(nodeId, selectInTree, checkModel) {
	var findInContainment = true;
	if (activeTab && activeTab.id == 'diagrams_tab') {
		findInContainment = false;
	}

	if (findInContainment) {
		findNodeForSelectedInContainment(nodeId, selectInTree, checkModel);
	}
	else {
		var root = diagramsTree.root;
		var dataModel = diagramsTree.root.index;
		var xmlPath = 'xml/diagrams_tree/diagramtree.xml';

		internalFindNodeForSelected(nodeId, selectInTree, root, dataModel, xmlPath, true, checkModel);
	}

	return null;
}

function findNodeForSelectedInContainment(nodeId, selectInTree, checkModel) {
	var root = tree.root;
	var dataModel = tree.root.index;
	var xmlPath = 'xml/data.xml';

	internalFindNodeForSelected(nodeId, selectInTree, root, dataModel, xmlPath, false, checkModel);
}

function internalFindNodeForSelected(nodeId, selectInTree, root, dataModel, xmlPath, findInContaintIfNotFound, checkModel) {
	if (root && dataModel) {
		showLoading();
		var content = document.getElementById('content');
		if (content.model) {
			// var regx = new RegExp('^' + nodeId + '$', 'i');
			internalFindNode(nodeId, selectInTree, dataModel, findInContaintIfNotFound);
		}
		hideLoading();
	} else {
		XMLRequest.send(resourcesLocation + xmlPath, function(responseXML) {
			var magicdraw;
			if (responseXML)
				magicdraw = responseXML.getElementsByTagName('magicdraw')[0];
			if (magicdraw != null) {
				// set data.xml to tree.root.index
				root.index = responseXML; // TODO
				var content = document.getElementById('content');

				if (content.model || (typeof checkModel != "undefined" && !checkModel)) {
					var dataModel = responseXML;
					// var regx = new RegExp('^' + nodeId + '$', 'i');
					internalFindNode(nodeId, selectInTree, dataModel, findInContaintIfNotFound);
				}
			}

		}, false, true);
	}
}

function internalFindNode(nodeId, selectInTree, dataModel, findInContaintIfNotFound) {
	var searchResults = new Array(0);
	findNodeByAttribute(dataModel, 'refid', nodeId, searchResults, 1);
	if (searchResults.length == 1) {
		var parentNode = searchResults[0];
		var nodePath = new Array();
		while (parentNode && parentNode.tagName != 'magicdraw') {
			if (parentNode.nodeType == 1) {
				var refid = parentNode.getAttribute('refid');
				if (refid)
					nodePath[nodePath.length] = refid;
				parentNode = parentNode.parentNode;
			}
		}
		expandPath(nodePath, selectInTree);
	}
	else if (findInContaintIfNotFound) {
		showContainmentTab(false);
		findNodeForSelectedInContainment(nodeId, selectInTree);
	}
}

/**
 * Select node on containment tree
 *
 * @param node LI or A element of tree node
 */

function selectNode(node) {
	if (node) {
		if (node.tagName == 'LI') {
			var childNodes = node.childNodes;
			for ( var i = 0; i < childNodes.length; i++) {
				if (childNodes[i].name == 'anchorNode') {
					setHighlightNode(childNodes[i], node);
					break;
				}
			}
		} else if (node.tagName == 'A') {
			if (node.name == 'anchorNode') {
				setHighlightNode(node, node.parentNode);
			}
		}
	}
}

function setHighlightNode(node, liNode) {

	// remove hightlight of current tab
	var selectedTab = null;
	for (var i = 0; i < tabs.length; i++) {
		var tabid = tabs[i].id + "_tab";
		if (tabid == activeTab.id) {
			var treeId = tabs[i].treeId;
			var root = document.getElementById(treeId);

			if (root) {
				var nodes = root.getElementsByTagName('li');
				for ( var n = 0; n < nodes.length; n++) {
					var anchorNodes = nodes[n].childNodes;
					for ( var a = 0; a < anchorNodes.length; a++) {
						if (anchorNodes[a].name == 'anchorNode')
							anchorNodes[a].style.backgroundColor = '';
					}
				}
			}

			tabs[i]["selectedNode"] = liNode;
			selectedTab = tabs[i];
			break;
		}
	}

	// add highlight
	node.style.backgroundColor = '#99CCFF';
	selectedNode = liNode;

	var isCustomModel = Boolean(liNode.mr_isCustomModel);
	updateNewTreeBtn(isCustomModel);
	updateCollapseRecursiveBtn(liNode.querySelector("ul"), selectedTab);
	updateCollapseAllBtn();
}

function updateNewTreeBtn(isCustomModel) {
	if (!activeTab || activeTab.id != "diagrams_tab") {

		var tabId = "containment_tab"
		if (activeTab)
			tabId = activeTab.id;

		for (var i = 0; i < tabs.length; i++) {
			var id = tabs[i].id;
			var currentTabId = id + "_tab";
			var currentToolId = id + "_tool";

			if (currentTabId == tabId) {
				var toolb = document.getElementById(currentToolId);
				var newTreeBtn = toolb.querySelector(".tool_newtree");
				if (newTreeBtn) {

					newTreeBtn.classList.remove("tool_newtree_inactive");
					newTreeBtn.classList.remove("tool_newtree_active");

					if (isCustomModel)
						newTreeBtn.classList.add("tool_newtree_inactive");
					else
						newTreeBtn.classList.add("tool_newtree_active");
				}
				break;
			}
		}
	}
}

function updateCollapseRecursiveBtn(ulNode, selectedTab) {
	if (skipUpdateCollapseBtn)
		return;

	if (typeof selectedTab == 'undefined' || selectedTab == null) {
		for (var i = 0; i < tabs.length; i++) {
			var tabid = tabs[i].id + "_tab";
			if (tabid == activeTab.id) {
				selectedTab = tabs[i];
				break;
			}
		}
	}

	// if selected node is expanded, enable
	var id = selectedTab.id;
	var currentToolId = id + "_tool";
	var toolb = document.getElementById(currentToolId);
	var collapseBtn = toolb.querySelector(".tool_collapse_recursive");

	if (collapseBtn) {
		collapseBtn.classList.remove("tool_collapse_recursive_inactive");
		collapseBtn.classList.remove("tool_collapse_recursive_active");

		if (ulNode) {
			if (ulNode.isExpanded)
				collapseBtn.classList.add("tool_collapse_recursive_active");
			else
				collapseBtn.classList.add("tool_collapse_recursive_inactive");
		}
		else {
			collapseBtn.classList.add("tool_collapse_recursive_inactive");
		}
	}
}

function updateCollapseAllBtn() {
	if (skipUpdateCollapseBtn)
		return;

	var tabId = "containment_tab"
	if (activeTab)
		tabId = activeTab.id;

	var disableCollapseAll = true;
	for (var i = 0; i < tabs.length; i++) {
		var id = tabs[i].id;
		var currentTabId = id + "_tab";
		var treeId = tabs[i].treeId; // ul /tree, dtree, elementid_tree
		var toolId = id + "_tool";

		if (tabId == currentTabId) {
			var root = document.getElementById(treeId);
			var lis = root.querySelectorAll(":scope > li");
			for (var k = 0; k < lis.length; k++) {
				var ul = lis[k].querySelector(":scope > ul");
				if (ul && ul.isExpanded) {
					var childs = lis[k].querySelectorAll(":scope > ul > li");
					for (var j = 0; j < childs.length; j++) {
						var ulNode = childs[j].querySelector(":scope > ul");
						if (childs[j].isExpanded || (ulNode && ulNode.isExpanded)) {
							disableCollapseAll = false;
							break;
						}
					}
				}
			}

			var toolb = document.getElementById(toolId);
			var collapseAllBtn = toolb.querySelector(".tool_collapse_all");
			if (collapseAllBtn) {
				collapseAllBtn.classList.remove("tool_collapse_all_inactive");
				collapseAllBtn.classList.remove("tool_collapse_all_active");

				if (disableCollapseAll) {
					collapseAllBtn.classList.add("tool_collapse_all_inactive");
				}
				else {
					collapseAllBtn.classList.add("tool_collapse_all_active");
				}
			}
			break;
		}
	}
}


function addChildNode(ul, nodeName, member, icon) {
	var node = document.createElement('li');
	node.className = 'nm-content';
	node.elementName = nodeName;
	node.hasChild = Boolean(member.getAttribute('hasChild'));

    var isMountedChild = Boolean(member.getAttribute('isMountedChild'));

	if (ul.dummyid)
		node.parentULDummyID = ul.dummyid;

	var anchor = document.createElement('a');

	var textNode;
	var suffix = member.getAttribute('suffixName');
	if (isMountedChild && suffix)
	    textNode = document.createTextNode(nodeName + " " + suffix);

	if (!textNode)
	    textNode = document.createTextNode(nodeName);

    anchor.appendChild(textNode);
    anchor.name = 'anchorNode';

    if (showAppliedStereotypes)
    {
        var appledStereotypes = member.getAttribute('mr_tree_appliedstereotype');
        if (appledStereotypes)
        {
            var stereotypelist = document.createElement('span');
            stereotypelist.className = 'stereotype';
            var sTextNode = document.createTextNode(" " + appledStereotypes);
            stereotypelist.appendChild(sTextNode);
            anchor.appendChild(stereotypelist);
        }
    }

	var refID = member.getAttribute('refid');
	var isCustomModel = Boolean(member.getAttribute('mr_isCustomModel'));
	if (!isCustomModel)
		anchor.href = "javascript: gotoElement('" + refID + "', false, true);";
	else {
		anchor.href = "javascript:void(0);";
		node.mr_isCustomModel = true;
	}
	anchor.style.verticalAlign = 'middle';
	anchor.style.marginLeft = '4px';
	anchor.style.marginRight = '4px';
	anchor.onclick = function() {
		selectNode(this);

		if (isCustomModel) {
		    clearDocumentationTab();
            clearPropertiesTab();
		}
	};
	anchor.className = 'nm-content';
	node.appendChild(anchor);

	if (icon) {
		var imgAnchor = document.createElement('a');
		imgAnchor.style.verticalAlign = 'middle';
		imgAnchor.style.position = "relative";

		if (!isCustomModel) {
			if ((gotoLinkByIcon == true && member.getAttribute('hasLink') == "true") || member.getAttribute('hasLink') != "true")
			{
				var refID = member.getAttribute('refid');
				imgAnchor.href = "javascript: gotoElement('" + refID + "', false, true);";
			}
			else
				imgAnchor.href = "javascript: showSpec('" + member.getAttribute('refid') + "');";


			imgAnchor.onclick = anchor.onclick;
			imgAnchor.className = 'nm-content';
		}
		else {
			imgAnchor.className = 'nm-content skipMouseEvent';
		}

		if (member.getAttribute('hasActiveHyperLink') == "true")
		{
			var navigatingIcon = document.createElement('img');
			navigatingIcon.className = 'nm-content';
			navigatingIcon.src = resourcesLocation + 'images/tree/hyperlinknode.gif';
			navigatingIcon.alt = '';
			navigatingIcon.border = '0';
			navigatingIcon.height = '8';
			navigatingIcon.width = '8';
			navigatingIcon.style.verticalAlign = 'middle';
			navigatingIcon.style.position = 'absolute';
			navigatingIcon.style.zIndex = 2;
			navigatingIcon.style.marginTop = '8px';
			imgAnchor.appendChild(navigatingIcon);
		}

		if (favoriteElements.indexOf(member.getAttribute('refid')) >= 0)
		{
			var navigatingIcon = document.createElement('img');
			navigatingIcon.className = 'nm-content';
			navigatingIcon.src = resourcesLocation + 'images/tree/favoriteelementadornment.gif';
			navigatingIcon.alt = '';
			navigatingIcon.border = '0';
			navigatingIcon.height = '8';
			navigatingIcon.width = '8';
			navigatingIcon.style.verticalAlign = 'middle';
			navigatingIcon.style.position = 'absolute';
			navigatingIcon.style.zIndex = 2;
			navigatingIcon.style.marginTop = '0px';
			imgAnchor.appendChild(navigatingIcon);
		}
		var img = document.createElement('img');
		img.className = 'nm-content';
		img.src = icon;
		img.alt = '';
		img.border = '0';
		img.height = '16';
		img.width = '16';
		img.style.verticalAlign = 'middle';
		imgAnchor.appendChild(img);
		node.insertBefore(imgAnchor, anchor);
	}

	// https://jira.nomagic.com/browse/MGRP-3251 - Add element number
	var isExtendedIdShow = false;
	if (displayelementid)
	{
		var extendedID = member.getAttribute('mr_tree_element_id');
		if (typeof(extendedID) != 'undefined' && extendedID != null)
		{
			var idNode = document.createElement('span');
			idNode.className = 'nm-content';
			idNode.style.color = '#9E9E9E';
			idNode.appendChild(document.createTextNode(extendedID + " "));
			anchor.insertBefore(idNode, textNode);
			isExtendedIdShow = true;
		}
	}
	if (!isExtendedIdShow && displayelementnumber)
	{
		var extendedID = member.getAttribute('mr_tree_element_number');
		if (typeof(extendedID) != 'undefined' && extendedID != null && extendedID.length != 0)
		{
			var idNode = document.createElement('span');
			idNode.className = 'nm-content';
			idNode.style.color = '#9E9E9E';
			idNode.appendChild(document.createTextNode(extendedID + " "));
			anchor.insertBefore(idNode, textNode);
		}
	}

	ul.appendChild(node);
	return node;
	// minus = resourcesLocation + 'images/tree/minus.gif';
}

/**
 * Add non-hyperlink child node.
 */
function addGroupNode(ul, nodeName, member, icon) {
	var node = document.createElement('li');
	node.className = 'nm-content';
	node.elementName = nodeName;
	node.mr_isCustomModel = true;

	var anchor = document.createElement('a');
	anchor.href="javascript:void(0);"
	anchor.className = 'nm-content';
	anchor.appendChild(document.createTextNode(nodeName));
	anchor.name = 'anchorNode';
	anchor.style.verticalAlign = 'middle';
	anchor.style.marginLeft = '4px';
	anchor.style.marginRight = '4px';
	anchor.onclick = function() {
		selectNode(this);
		clearDocumentationTab();
        clearPropertiesTab();
	};

	node.appendChild(anchor);

	if (icon) {
		var img = document.createElement('img');
		img.className = 'nm-content';
		img.src = icon;
		img.alt = '';
		img.border = '0';
		img.height = '16';
		img.width = '16';
		img.style.verticalAlign = 'middle';
		node.insertBefore(img, anchor);
	}

	ul.appendChild(node);
	return node;
}

function addNode(ul, nodeName, href, icon, hasChild, skipMouseEvent) {
	var className = 'nm-content';
	var anchor;

	var node = document.createElement('li');

	if (skipMouseEvent)
	{
		className = className + ' skipMouseEvent';
		anchor = document.createElement('a');
		node.mr_isCustomModel = true;
	}
	else
		anchor = document.createElement('a');

	node.className = 'nm-content';
	node.elementName = nodeName;
	node.hasChild = Boolean(hasChild);
	//var anchor = document.createElement('a');
	anchor.className = 'nm-content';
	anchor.appendChild(document.createTextNode(nodeName));
	anchor.name = 'anchorNode';
	anchor.href = href;
	anchor.style.verticalAlign = 'middle';
	anchor.style.marginLeft = '4px';
	anchor.style.marginRight = '4px';
	anchor.onclick = function() {
		selectNode(this);
		if (skipMouseEvent) {
		    clearDocumentationTab();
            clearPropertiesTab();
        }
	};
	node.appendChild(anchor);
	if (icon) {
		var imgAnchor = document.createElement('a');
		imgAnchor.className = className;
		imgAnchor.href = href;
		imgAnchor.style.verticalAlign = 'middle';
		imgAnchor.onclick = anchor.onclick;
		var img = document.createElement('img');
		img.className = 'nm-content';
		img.src = icon;
		img.alt = '';
		img.border = '0';
		img.height = '16';
		img.width = '16';
		img.style.verticalAlign = 'middle';
		imgAnchor.appendChild(img);
		node.insertBefore(imgAnchor, anchor);
	}
	ul.appendChild(node);
	return node;
}

/**
 * Shortcut to create HTML element with link
 *
 * @param parentNode link container
 * @param linkToElement DOM element
 */
function createLink(parentNode, linkToElement) {
	var refid = linkToElement.getAttribute('refid');
	var name = linkToElement.getAttribute('name');
	var icon = linkToElement.getAttribute('icon');

	if (!name)
		name = nonamedLink || nonamedLink == '' ? nonamedLink : linkToElement.tagName;
	var additionalText = linkToElement.getAttribute('text');

	createLinkHTML(parentNode, refid, name, icon, additionalText);
}

function createLinkHTML(parentNode, refid, name, icon, additionalText) {
	firstShow = false;

	if (icon) {
		var fieldAnchor = document.createElement('a');
		fieldAnchor.className = 'nm-content';
		fieldAnchor.href = "javascript: showSpec('" + refid + "');";
		var fieldImage = document.createElement('img');
		fieldImage.className = 'nm-content';
		fieldImage.alt = '';
		fieldImage.border = '0';
		fieldImage.height = '16';
		fieldImage.width = '16';
		fieldImage.src = icon;
		fieldAnchor.appendChild(fieldImage);
		parentNode.appendChild(fieldAnchor);
	}

	if (refid && name != '') {
		var fieldAnchor = document.createElement('a');
		fieldAnchor.className = 'nm-content';
		fieldAnchor.href = "javascript: showSpec('" + refid + "');";
		fieldAnchor.style.marginLeft = '4px';
		fieldAnchor.style.marginRight = '4px';
		fieldAnchor.appendChild(document.createTextNode(name));
		fieldAnchor.onmouseover = function(e) {
			var evt = getEvent(e);
			var target = evt.target ? evt.target : evt.srcElement;
			documentation = null;
			if (documentMap.containsKey(refid)) {
				documentation = documentMap.get(refid);
				createDocBallon(evt);
			} else {
				XMLRequest.send(resourcesLocation + 'xml/' + refid + '.xml', function(responseXML) {
					if (responseXML) {
						documentation = responseXML.getElementsByTagName('documentation').item(0);
						if (documentation != null) {
							documentMap.put(refid, documentation);
						}
						createDocBallon(evt);
					}
				}, false, true);
			}
		};
		fieldAnchor.onmouseout = function(e) {
			var value = document.getElementById('docBalloon');
			if (value)
			{
				value.style.visibility = 'hidden';
				value.style.display = 'none';
			}
		};
		fieldAnchor.onclick = function(e) {
			var value = document.getElementById('docBalloon');
			if (value)
			{
				value.style.visibility = 'hidden';
				value.style.display = 'none';
			}
		};
		parentNode.appendChild(fieldAnchor);
	} else {
		parentNode.appendChild(document.createTextNode(name));
	}

	if (additionalText) {
		var cite = document.createElement('cite');
		cite.className = 'nm-content';
		cite.style.marginLeft = '4px';
		cite.style.marginRight = '4px';
		renderValueText(cite, additionalText);
		parentNode.appendChild(cite);
	}
}

function createDocBallon(evt) {
	if (documentMap.size() == 50) {
		documentMap.remove(0);
	}

	if (documentation != null) {
		var text = nodeValue(documentation);
		if (text != null && text.length > 0) {
			var value = document.getElementById('docBalloon');
			if (value == null) {
				var value = document.createElement('span');
				value.className = 'nm-content';
				value.id = 'docBalloon';
				value.style.position = 'absolute';
				value.style.border = '#A5CFE9 solid 1px';
				value.style.fontFamily = 'arial';
				value.style.fontSize = 'x-small';
				value.style.padding = '3px';
				value.style.color = '#1B4966';
				value.style.background = '#FFFFFF';
				value.style.textAlign = 'left';
				value.style.zIndex = 900;
				value.onmouseout = function(e) {
					var value = document.getElementById('docBalloon');
					if (value)
					{
						value.style.visibility = 'hidden';
						value.style.display = 'none';
					}
				};
				document.body.appendChild(value);
			}
			if (value.style.visibility == 'hidden' || !firstShow) {
				firstShow = true;
				var mic = Graphics.mousePosition(evt);
				var mouseX = mic.x + 2;
				var mouseY = mic.y + 2;
				value.style.left = mouseX + 'px';
				value.style.top = mouseY + 'px';
				value.style.visibility = 'visible';
				value.style.display = 'block';
				removeAll(value);
				renderValueNode(value, documentation);
			}
		}
	}
}

function selectView(view) {
	viewbar.currentView = view;
	var viewtab = document.getElementById('viewtab');
	var sib = firstChild(viewtab);
	while (sib != null) {
		sib.className = '';
		if (sib.tabName == view) {
			sib.className = 'active';
			sib.style.display = 'block';
		}
		sib = nextSibling(sib);
	}
	var modeItem = document.getElementById('modeItem');
	if (view == 'specification')
		modeItem.setEnabled(true);
	else
		modeItem.setEnabled(false);
}

function createViewBar(model) {
	if (viewbar)
		return viewbar;
	// lazy initialize
	viewbar = document.createElement('div');
	viewbar.className = 'nm-content';
	viewbar.id = 'viewbar';
	viewbar.currentType = model.tagName == 'diagram' ? 'diagram' : 'element';
	viewbar.currentView = 'specification';
	// tab bar
	var tabul = document.createElement('ul');
	tabul.id = 'viewtab';
	tabul.className = 'nm-content tab';
	var diali = document.createElement('li');
	diali.className = 'nm-content';
	diali.id = 'diagramtab';
	diali.tabName = 'diagram';
	diali.appendChild(document.createTextNode('Diagram'));
	diali.onclick = function() {
		selectView(this.tabName);
		var content = document.getElementById('content');
		renderDiagram(content.model, content.diagamModel);
		repaint();
	};
	tabul.appendChild(diali);
	var speli = document.createElement('li');
	speli.className = 'nm-content';
	speli.id = 'specificationtab';
	speli.tabName = 'specification';
	speli.appendChild(document.createTextNode('Specification'));
	speli.onclick = function() {
		selectView(this.tabName);
		var content = document.getElementById('content');
		renderElement(content.model);
		repaint();
	};
	tabul.appendChild(speli);
	if (showappearsinpage) {
		var apearli = document.createElement('li');
		apearli.className = 'nm-content';
		apearli.id = 'appearsintab';
		apearli.tabName = 'appearsin';
		apearli.appendChild(document.createTextNode('Appears in'));
		apearli.onclick = function() {
			selectView(this.tabName);
			var content = document.getElementById('content');
			renderAppearsIn(content.model);
			repaint();
		};
		tabul.appendChild(apearli);
	}
	viewbar.appendChild(tabul);

	var modeItem = createPropertiesModeMenu();
	tabul.appendChild(modeItem);
	return viewbar;
}

function createPropertiesModeMenu(forProperties)
{
		// view mode
	if (typeof (propertiesMode) == 'undefined')
		propertiesMode = 's';

	var content = document.getElementById('content');
	if (typeof (content.mode) == 'undefined')
		content.mode = propertiesMode;

	var propertiesContent = document.getElementById('properties_content_div');
	if (typeof (propertiesContent.mode) == 'undefined')
		propertiesContent.mode = propertiesMode;

	var modeItem = document.createElement('li');
	modeItem.className = 'nm-content';
	if (forProperties)
		modeItem.id = 'propertiesModeItem';
	else
	{
		modeItem.id = 'modeItem';
		modeItem.setEnabled = function(enabled) {
			var childNodes = this.childNodes;
			for ( var c = 0; c < childNodes.length; c++)
				childNodes[c].disabled = !enabled;
		};
	}
	modeItem.style.cssFloat = 'right';
	modeItem.style.styleFloat = 'right';
	modeItem.style.margin = '0';
	modeItem.style.padding = '2px .5em 0 .5em';
	modeItem.style.cursor = 'default';

	// mode label
	var modeLabel = document.createElement('div');
	modeLabel.title = 'Display properties by selected filter';
	modeLabel.className = 'nm-content item';
	modeLabel.style.cssFloat = 'left';
	modeLabel.style.styleFloat = 'left';
	modeLabel.appendChild(document.createTextNode('Mode : '));
	modeItem.appendChild(modeLabel);
	// move options
	var modeSelect = document.createElement('select');
	modeSelect.className = 'nm-content';
	if (forProperties)
		modeSelect.id = 'propertiesModeSelect';
	else
		modeSelect.id = 'modeSelect';

	modeSelect.onchange = function() {
		propertiesMode = this.options[this.selectedIndex].value;

		var content = document.getElementById('content');
		content.mode = this.options[this.selectedIndex].value;

		var propertiesContent = document.getElementById('properties_content_div');
		propertiesContent.mode = this.options[this.selectedIndex].value;

		var mainSelectOption = document.getElementById('modeSelect');
		mainSelectOption.value = propertiesMode;

		var propertiesSlectOption = document.getElementById('propertiesModeSelect');
		propertiesSlectOption.value = propertiesMode;

		// change mode in Specification view
		if (modeSelect.id == 'modeSelect' && content.model)
		{
			renderElement(content.model);
			if (propertiesContent.model)
			{
				showPropertiesTab(propertiesContent.model);
			}
		}

		// change mode in Properties view
		else if (modeSelect.id == 'propertiesModeSelect' && propertiesContent.model)
		{
			showPropertiesTab(propertiesContent.model);
			// only when specification tab is active, re-render element
			if (viewbar.currentView == 'specification' && content.model)
				renderElement(content.model);
		}

		repaint();
	};
	var standardModeOption = document.createElement('option');
	standardModeOption.className = 'nm-content';
	standardModeOption.value = 's';
	if (content.mode == 's')
		standardModeOption.selected = 'true';
	standardModeOption.appendChild(document.createTextNode('Standard'));
	modeSelect.appendChild(standardModeOption);
	var expertModeOption = document.createElement('option');
	expertModeOption.className = 'nm-content';
	expertModeOption.value = 'e';
	if (content.mode == 'e')
		expertModeOption.selected = 'true';
	expertModeOption.appendChild(document.createTextNode('Expert'));
	modeSelect.appendChild(expertModeOption);
	var allModeOption = document.createElement('option');
	allModeOption.className = 'nm-content';
	allModeOption.value = '';
	if (content.mode == '')
		allModeOption.selected = 'true';
	allModeOption.appendChild(document.createTextNode('All'));
	modeSelect.appendChild(allModeOption);
	modeItem.appendChild(modeSelect);
	return modeItem;
}

function createActionBar(model) {
	if (actionbar) {
		// Change permanent link url to current element.
		if (actionbar.lastChild && actionbar.lastChild.id == 'permLinkAnchor') {
			actionbar.lastChild.href = new String(window.location.protocol + "//" + window.location.host
				+ window.location.pathname + '?refid=' + model.getAttribute('id'));
		}
		return actionbar;
	}
	// lazy initialize
	actionbar = document.createElement('div');
	actionbar.className = 'nm-content';
	actionbar.id = 'actionbar';
	// back
	var backButton = document.createElement('div');
	backButton.id = 'backButton';
	backButton.className = 'nm-content backDisabled';
	backButton.title = 'Back';
	backButton.onclick = function() {
		back();
	};
	actionbar.appendChild(backButton);
	// forward
	var forwardButton = document.createElement('div');
	forwardButton.id = 'forwardButton';
	forwardButton.className = 'nm-content forwardDisabled';
	forwardButton.title = 'Forward';
	forwardButton.onclick = function() {
		forward();
	};
	actionbar.appendChild(forwardButton);
	// select in containment tree
	var selectTreeButton = document.createElement('div');
	selectTreeButton.id = 'selectTreeButton';
	selectTreeButton.className = 'nm-content selectTreeButton';
	selectTreeButton.title = 'Select in Containment Tree';
	selectTreeButton.onclick = function() {
		var content = document.getElementById('content');
		if (content.model) {
			var nodeId = content.model.getAttribute('id');
			findNodeForSelected(nodeId, true);
		}
	};
	actionbar.appendChild(selectTreeButton);
	// permanent link
	var permLinkAnchor = document.createElement('a');
	permLinkAnchor.className = 'nm-content';
	permLinkAnchor.id = 'permLinkAnchor';
	permLinkAnchor.target = "_blank";
	permLinkAnchor.href = new String(window.location.protocol + "//" + window.location.host + window.location.pathname
		+ '?refid=' + model.getAttribute('id'));
	var permLinkButton = document.createElement('div');
	permLinkButton.id = 'permLinkButton';
	permLinkButton.className = 'nm-content permLinkButton';
	permLinkButton.title = 'Open element in new page';
	permLinkAnchor.appendChild(permLinkButton);
	actionbar.appendChild(permLinkAnchor);
	return actionbar;
}

/**
 * Value node renderer
 *
 * @param value a HTML element containing value
 * @param element DOM element
 */

function renderValueNode(value, element, skipAddingSpace) {
	var text = nodeValue(element);
	renderValueText(value, text, skipAddingSpace);
}

/**
 * Value text renderer
 *
 * @param value a HTML element containing value
 * @param text text to display
 */

function renderValueText(value, text, skipAddingSpace) {
	var htmlContent = "";
	var foundHTMLText = false;
	if (text && (text.indexOf('<html>') >= 0 || text.indexOf('<html ') >= 0)) {
		// Found HTML code
		var endBodyIndex = -1;
		var startBodyIndex = text.indexOf('<body>');
		if (startBodyIndex < 0)
			startBodyIndex = text.indexOf('<body ');
		if (startBodyIndex > 0) {
			endBodyIndex = text.indexOf('</body>', startBodyIndex);
			//if (startBodyIndex > 0 && endBodyIndex > 0) {
			if (endBodyIndex > 0) {
				foundHTMLText = true;
				htmlContent = text.substring(startBodyIndex, endBodyIndex);
			}
		}
		else {
			// If <body> not found, use <html> instead
			startBodyIndex = text.indexOf('<html>');
			if (startBodyIndex < 0)
				startBodyIndex = text.indexOf('<html ');
			endBodyIndex = text.indexOf('</html>', startBodyIndex);
			//if (startBodyIndex >= 0 && endBodyIndex > 0) {
			if (endBodyIndex > 0) {
				foundHTMLText = true;
				htmlContent = text.substring(startBodyIndex, endBodyIndex);
			}
		}
	}
	if (foundHTMLText) {
		if (htmlContent.indexOf('mdel://') >= 0) {
			var reg = new RegExp('(<\s*a.+)href\s*=\s*\"(mdel://)([^"]*)\"(.*>)', 'gi');
			htmlContent = htmlContent.replace(reg, "$1href=\"javascript:showSpec('$3')\"$4");
		}
		value.innerHTML += htmlContent;
	}
	else {
		var token;
		if (skipAddingSpace == true)
			tokens = (text).split(/\r\n|\n|\r/);
		else
		    tokens = ('\u00A0' + text).split(/\r\n|\n|\r/);
		if (tokens.length > 1) {
			for ( var t = 0; t < tokens.length; t++) {
				renderValueLink(value, tokens[t]);
				value.appendChild(document.createElement('br'));
			}
		} else {
			renderValueLink(value, tokens[0]);
		}
	}
}

/**
 * Value link renderer
 *
 * @param value a HTML element containing value
 * @param text text containing link
 */

function renderValueLink(value, text) {
	if (text == null)
		text = '';
	if (text.indexOf('http://') == 1 || text.indexOf('https://') == 1 || text.indexOf('smb://') == 1) {
		text = text.substring(1);
		var anchor = document.createElement('a');
		anchor.className = 'nm-content';
		anchor.href = text;
		anchor.target = '_blank';
		anchor.appendChild(document.createTextNode(text));
		value.appendChild(anchor);
	} else if (text.indexOf('file://') == 1) {
		var url = trim(text).substring(7);
		if (url.charAt(0) == '/')
			url = url.substring(1);
		if (url.length >= 4) {
			var endsWith = url.substring(url.length - 4).toLowerCase();
			if (endsWith == '.flv' || endsWith == '.mp4') {
				var container = document.createElement('div');
				container.className = 'nm-content';
				container.style.height = '344px';
				container.style.width = '480px';
				var embed = document.createElement('embed');
				embed.className = 'nm-content';
				embed.src = resourcesLocation + 'swf/WebVideo.swf';
				embed.type = 'application/x-shockwave-flash';
				embed.width = '100%';
				embed.height = '100%';
				embed.setAttribute('flashvars', 'url=../../' + url);
				embed.setAttribute('quality', 'high');
				container.appendChild(embed);
				value.appendChild(container);
			} else if (endsWith == '.mp3') {
				var container = document.createElement('div');
				container.className = 'nm-content';
				container.style.height = '24px';
				container.style.width = '320px';
				var embed = document.createElement('embed');
				embed.className = 'nm-content';
				embed.src = resourcesLocation + 'swf/WebAudio.swf';
				embed.type = 'application/x-shockwave-flash';
				embed.width = '100%';
				embed.height = '100%';
				embed.setAttribute('flashvars', 'url=' + url);
				embed.setAttribute('quality', 'high');
				value.appendChild(embed);
				container.appendChild(embed);
				value.appendChild(container);
			} else if (endsWith == '.swf') {
				var container = document.createElement('div');
				container.className = 'nm-content';
				container.style.height = '344px';
				container.style.width = '480px';
				var embed = document.createElement('embed');
				embed.className = 'nm-content';
				embed.src = url;
				embed.type = 'application/x-shockwave-flash';
				embed.width = '100%';
				embed.height = '100%';
				embed.setAttribute('quality', 'high');
				container.appendChild(embed);
				value.appendChild(container);
			} else {
				var pathOffset = url.lastIndexOf('/');
				var name = url;
				if (pathOffset >= 0)
					name = url.substring(pathOffset + 1);
				var anchor = document.createElement('a');
				anchor.className = 'nm-content';
				url = getFileURL(url);
				anchor.href = url;
				anchor.target = '_blank';
				anchor.appendChild(document.createTextNode(name));
				value.appendChild(anchor);
			}
		}
	} else {
		value.appendChild(document.createTextNode(text));
	}
}

/**
 * Render browser tree
 *
 * @param responseXML a xml
 */
function renderBrowser(responseXML) {

    initFavorite();

	var rootModel;
	if (responseXML) {
		showLoading();
		var root = document.createElement('ul');
		root.className = 'nm-content';
		root.id = 'tree';
		tree = new Tree(root.id);
		tree.image.plus = resourcesLocation + 'images/tree/plus.gif';
		tree.image.minus = resourcesLocation + 'images/tree/minus.gif';
		tree.root = root;
		containmentT["tree"] = tree;

		var browser = document.getElementById('containment_content');

		/*
		// TODO 1. get data from root
		var dataModel = getPrimaryModel(responseXML);
		var node = addChildNode(root, dataModel.getAttribute('name'), dataModel, dataModel.getAttribute('icon'));
		node.data = dataModel;
		node.setAttribute('refid', dataModel.getAttribute('refid'));
		buildTree(node);

		// TODO 2. get other model such as Project Usages from root
		var dataModel2 = getSpecifiedModel(responseXML, 'primarymodel');
		if (dataModel2) {
			var node2 = addChildNode(root, dataModel2.getAttribute('name'), dataModel2, dataModel2.getAttribute('icon'));
			node2.data = dataModel2;
			node2.setAttribute('refid', dataModel2.getAttribute('refid'));
			buildTree(node2);
		}
		*/

		// responseXML.firstChild is <tree>
		// fixed https://jira.nomagic.com/browse/MGRP-3396
		var firstChild = responseXML.getElementsByTagName('tree')[0];
		var dataModels = getModels(firstChild);
		var firstNode = null;
		for(var i = 0; i< dataModels.length; i++)
		{
			var dataModel = dataModels[i];
			var node = addChildNode(root, dataModel.getAttribute('name'), dataModel, dataModel.getAttribute('icon'));
			node.data = dataModel;
			node.setAttribute('refid', dataModel.getAttribute('refid'));
			buildTree(node);
			if (firstNode == null)
				firstNode = node;
		}


		browser.appendChild(root);
		// fixed (Web Publisher 2.0) Collapsed Model node in browser
		if (firstNode != null) {
			tree.expand(firstNode);
			var ulNode = firstNode.querySelector("ul");
			if (ulNode)
				firstNode.isExpanded = true;
		}
		hideLoading();
		if (gotoElementId != '') {
			showSpec(gotoElementId, false);
		}

		activeTab = document.getElementById("containment_tab");
	}
}

var usehyperlink = false;
var useStack = false;
var autonavigatehyperlink = true;
var stopHyperlink = false;
/**
 * Render model
 *
 * @param responseXML a xml
 */

function renderModel(responseXML) {
	var contextMenu = document.getElementById('elementcontextmenu');
	if (contextMenu) {
		contextMenu.style.disply = 'none';
		contextMenu.style.visibility = 'hidden';
		Shadow.removeShadow(contextMenu);
	}
	var magicdraw;
	if (responseXML)
		magicdraw = responseXML.getElementsByTagName('magicdraw')[0];
	if (magicdraw == null) {
		alert('This element was not generated from project.');
		return;
	}
	var model = firstChild(magicdraw);

	if (!propertiesRendered)
	{
		showPropertiesTab(model);
		propertiesRendered = true;
	}
	// validate hyperlinkModelActive
	var stopRender = false;
	if (model.hasChildNodes && usehyperlink && !stopHyperlink) {
		var childNodes = getChildNodes(model);
		var humanName = model.getAttribute('humanType');
		for ( var c = 0; c < childNodes.length && !stopRender; c++) {
			// Stereotype
			if (childNodes[c].tagName == appliedStereotyeGroupName) {
				if (childNodes[c].hasChildNodes) {
					var stereotypes = getChildNodes(childNodes[c]);
					for ( var s = 0; s < stereotypes.length && !stopRender; s++) {
						var stereotypeName = stereotypes[s].getAttribute('name');
						if (stereotypeName == 'HyperlinkOwner') {
							if (stereotypes[s].hasChildNodes) {
								var properties = stereotypes[s].childNodes;
								for ( var p = 0; p < properties.length && !stopRender; p++) {
									var propertyName = properties[p].getAttribute('name');
									if (propertyName == 'hyperlinkModelActive') {
										if (properties[p].hasChildNodes) {
											var elements = getChildNodes(properties[p]);
											for ( var e = 0; e < elements.length && !stopRender; e++) {
												var refid = elements[e].getAttribute('refid');
												if (refid) {
													if(!autonavigatehyperlink)
														stopHyperlink = true;
													usehyperlink = false;
													gotoElement(refid, false);
													stopRender = true;
												}
											}
										}
									} else if (propertyName == 'hyperlinkTextActive') {
										if (properties[p].hasChildNodes) {
											var elements = getChildNodes(properties[p]);
											for ( var e = 0; e < elements.length && !stopRender; e++) {
												var uri = nodeValue(elements[e]);
												var refid = elements[e].getAttribute('refid');
												if (refid) {
													if(!autonavigatehyperlink)
														stopHyperlink = true;
													usehyperlink = false;
													gotoElement(refid, false);
													stopRender = true;
												} else if (uri != null) {
													usehyperlink = false;
													if (uri.indexOf("file://") == 0) {
														var tokens = uri.substring(7);
														//window.open(tokens);
														window.open('','_blank').location.href = getFileURL(tokens);
													} else {
														var tokens = (' ' + uri).split(/(\r\n|[\r\n])/g);
														//window.open(tokens[0]);
														window.open('','_blank').location.href = tokens[0];
													}
													propertiesRendered = false;
													stopRender = true;
												}
											}
										}
									}
								}
							}
						}
					}
				}
			}
		}
	}
	if (!stopRender) {
		stopHyperlink = false;
		var content = document.getElementById('content');
		if (usehyperlink) {
			usehyperlink = false;
			/* UPDM, SysML : need to check for attributes (may slow) */
			var mdRule = false;
			var skipOwnedBehavior = false;
			var ownedBehavior, ownedDiagram, classifierBehavior;
			var modelName;

			var aClassType = model.getAttribute('classType');
			if (aClassType == 'Activity' || aClassType == 'StateMachine' || aClassType == 'Interaction'
				|| aClassType == 'ProtocolStateMachine' || aClassType == 'OpaqueBehavior' || aClassType == 'FunctionBehavior')
				skipOwnedBehavior = true;

			for ( var b = 0; b < model.childNodes.length; b++) {
				if (model.childNodes[b].tagName == 'ownedBehavior') {
					ownedBehavior = model.childNodes[b];
				} else if (model.childNodes[b].tagName == 'ownedDiagram') {
					ownedDiagram = model.childNodes[b];
				} else if (model.childNodes[b].tagName == 'classifierBehavior') {
					classifierBehavior = model.childNodes[b];
				} else if (model.childNodes[b].tagName == 'name') {
					modelName = nodeValue(model.childNodes[b]);
				}
			}

			if (classifierBehavior) {
				var hasDiagram = classifierBehavior.getAttribute('hasDiagram');
				if (hasDiagram) {
					gotoElement(classifierBehavior.getAttribute('refid'), false);
					stopRender = true;
					mdRule = true;
				}
				else {
					skipOwnedBehavior = true;
				}
			}

			if (!mdRule && !skipOwnedBehavior && ownedBehavior) {
				// only owned Behavior with diagram
				var skipCheckFirstBehavior = false;
				for ( var d = 0; d < ownedBehavior.childNodes.length; d++) {
					var behavior = ownedBehavior.childNodes[d];
					var behaviorName = behavior.getAttribute('name');
					var hasDiagram = behavior.getAttribute('hasDiagram');
					if (modelName == behaviorName && hasDiagram) {
						gotoElement(behavior.getAttribute('refid'), false);
						stopRender = true;
						mdRule = true;
						break;
					}
					else if (modelName == behaviorName) {
						// skip behavior and go to check ownedDiagam
						skipCheckFirstBehavior = true;
						break;
					}
				}

				if (!mdRule && !skipCheckFirstBehavior && ownedBehavior.childNodes.length > 0) {
					var firstBehavior = ownedBehavior.firstChild;
					var hasDiagram = firstBehavior.getAttribute('hasDiagram');
					if (hasDiagram) {
						gotoElement(firstBehavior.getAttribute('refid'), false);
						stopRender = true;
						mdRule = true;
					}
				}
			}

			var diagramType = [];
			var checkSpecifiedDiagram = false;
			if (!mdRule) {
				var classType = model.getAttribute('classType');
				if (classType == 'Activity') {
					diagramType = ['Activity Diagram', 'Interaction Overview Diagram'];
					checkSpecifiedDiagram = true;
				}
				else if (classType == 'StateMachine' || classType == 'ProtocolStateMachine') {
					diagramType = ['State Machine Diagram', 'Protocol State Machine Diagram'];
					checkSpecifiedDiagram = true;
				}
				else if (classType == 'Interaction' ) {
					diagramType = ['Sequence Diagram', 'Communication Diagram'];
					checkSpecifiedDiagram = true;
				}
				else if (classType == 'OpaqueBehavior' || classType == 'FunctionBehavior') {
					checkSpecifiedDiagram = true;
				}
			}

			if (!mdRule && ownedDiagram) {
				if (checkSpecifiedDiagram) {
					for ( var d = 0; d < ownedDiagram.childNodes.length; d++) {
						var owned = ownedDiagram.childNodes[d];
						var diagramTypeName = owned.getAttribute('diagramType');
						if (diagramType.indexOf(diagramTypeName) > 0) {
							gotoElement(owned.getAttribute('refid'), false);
							stopRender = true;
							mdRule = true;
							break;
						}
					}
				}

				if (!mdRule && !(classType == 'Package' || classType == 'Model' || classType == 'Profile')) {
					if (ownedDiagram.childNodes.length > 0) {
						gotoElement(ownedDiagram.firstChild.getAttribute('refid'), false);
						stopRender = true;
						mdRule = true;
					}
				}
			}

			if (!mdRule && checkSpecifiedDiagram && ownedBehavior) {
				// recheck interaction
				for ( var d = 0; d < ownedBehavior.childNodes.length; d++) {
					var behavior = ownedBehavior.childNodes[d];
					var classType = behavior.getAttribute('classType');
					var hasDiagram = behavior.getAttribute('hasDiagram');
					if (classType == 'Interaction' && hasDiagram) {
						gotoElement(behavior.getAttribute('refid'), false);
						stopRender = true;
						mdRule = true;
						break;
					}
				}
			}

			/* General Rules */
			if (!mdRule) {
				var classType = model.getAttribute('classType');
				if (classType == 'CallBehaviorAction') {
					var behaviorTags = model.getElementsByTagName('behavior');
					if (behaviorTags.length > 0) {
						gotoElement(behaviorTags[0].getAttribute('refid'), false);
						stopRender = true;
					} else {
						renderElement(model);
						var diagramtab = document.getElementById('diagramtab');
						if (diagramtab)
							diagramtab.style.display = 'none';
						selectView('specification');
					}
				} else if (classType == 'State') {
					var submachineTags = model.getElementsByTagName('submachine');
					if (submachineTags.length > 0) {
						gotoElement(submachineTags[0].getAttribute('refid'), false);
						stopRender = true;
					} else {
						renderElement(model);
						var diagramtab = document.getElementById('diagramtab');
						if (diagramtab)
							diagramtab.style.display = 'none';
						selectView('specification');
					}
				} else if (classType == 'Collaboration') {
					content.model = model;
					var interaction = model.getElementsByTagName('interaction');
					if (interaction.length > 0) {
						gotoElement(interaction[0].getAttribute('refid'), false);
						stopRender = true;
					} else {
						renderElement(model);
						var diagramtab = document.getElementById('diagramtab');
						if (diagramtab)
							diagramtab.style.display = 'none';
						selectView('specification');
					}
				}  else if (classType == 'InteractionUse') {
					var refersTo = model.getElementsByTagName('refersTo');
					if (refersTo.length > 0) {
						gotoElement(refersTo[0].getAttribute('refid'), false);
						stopRender = true;
					} else {
						renderElement(model);
						var diagramtab = document.getElementById('diagramtab');
						if (diagramtab)
							diagramtab.style.display = 'none';
						selectView('specification');
					}
				} else if (classType == 'Activity' || classType == 'StateMachine' || classType == 'Interaction'
					|| classType == 'ProtocolStateMachine' || classType == 'OpaqueBehavior'
					|| classType == 'FunctionBehavior') {
					var diagramTags = model.getElementsByTagName('diagram');
					var diagramTagsRID = null;
					if (diagramTags.length > 0) {
						// find diagram id
						for (var k = 0; k < diagramTags.length; k++) {
							if (typeof(diagramTags[k].parentElement) != "undefined" && "appearsIn" != diagramTags[k].parentElement.nodeName) {
								diagramTagsRID = diagramTags[k].getAttribute('refid');
								break;
							}
							else if (typeof(diagramTags[k].parentNode) != "undefined" && "appearsIn" != diagramTags[k].parentNode.nodeName) {
								diagramTagsRID = diagramTags[k].getAttribute('refid');
								break;
							}
						}
					}

					if (diagramTagsRID != null) {
						gotoElement(diagramTagsRID, false);
						stopRender = true;
					} else {
						renderElement(model);
						var diagramtab = document.getElementById('diagramtab');
						if (diagramtab)
							diagramtab.style.display = 'none';
						selectView('specification');
					}
				} else if (model.tagName == 'diagram') {
					renderDiagram(model);
					selectView('diagram');
				} else {
					renderElement(model);
					var diagramtab = document.getElementById('diagramtab');
					if (diagramtab)
						diagramtab.style.display = 'none';
					selectView('specification');
				}
			}
		} else if (model.tagName == 'diagram') {
			renderDiagram(model);
			selectView('diagram');
		} else {
			renderElement(model);
			var diagramtab = document.getElementById('diagramtab');
			if (diagramtab)
				diagramtab.style.display = 'none';
			selectView('specification');
		}
		if (!stopRender) {
			var modelId = model.getAttribute('id');
			content.refid = modelId;
			if (modelId) {
				if (backStack.peek() != modelId) {
					backStack.push(modelId);
					if (backStack.size() > 1) {
						var backButton = document.getElementById('backButton');
						if (backButton != null)
							backButton.className = 'back';
					}
				}
				currentPageId = modelId;
				if (!useStack) {
					forwardStack.clear();
					var forwardButton = document.getElementById('forwardButton');
					if (forwardButton != null)
						forwardButton.className = 'forwardDisabled';
				}
			}
			repaint();
		}
	}
}

/**
 * Store review stereotype.
 */

function Review(no, text, author, date) {
	this.no = no;
	this.text = text;
	this.author = author;
	this.date = date;
}

/**
 * Store hyperlink stereotype.
 *
 * @param {String} id
 * @param {String} name
 * @param {String} icon
 * @param {boolean} isModel. Default value is true
 */

function ModelLink(id, name, icon, isModel) {
	this.id = id;
	this.name = name;
	this.icon = icon;
	if (typeof isModel != 'undefined')
	this.isModel = isModel;
	else
		this.isModel = true;
}

/**
 * Element specification renderer.
 */

function renderElement(model) {
	propertiesRendered = false;
	var content = document.getElementById('content');
	content.model = model;
	removeAll(content);
	content.appendChild(createActionBar(model));
	content.appendChild(createViewBar(model));
	var header = document.createElement('h2');
	header.className = 'nm-content';
	header.id = 'contentHeader';
	header.appendChild(document.createTextNode(model.getAttribute('humanType')));
	if (navigator.userAgent.indexOf('MSIE 6') >= 0)
		header.style.marginTop = '2em';
	content.appendChild(header);
	// content table
	if (model.hasChildNodes) {
		var table = document.createElement('div');
		table.className = 'nm-content table';
		var thead = document.createElement('div');
		thead.className = 'nm-content thead';
		thead.appendChild(document.createTextNode('General Information'));
		table.appendChild(thead);
		var tbody = document.createElement('div');
		tbody.id = 'generalTable';
		tbody.className = 'nm-content tbody';
		table.appendChild(tbody);
		content.appendChild(table);
		// peoperties
		var reviewList = new Array();
		var childNodes = getChildNodes(model);
		for ( var c = 0; c < childNodes.length; c++) {
			if (childNodes[c].tagName == 'name')
				header.appendChild(document.createTextNode(' ' + nodeValue(childNodes[c])));
			if (childNodes[c].nodeType == 1) {
				// Stereotype
				if (childNodes[c].tagName == appliedStereotyeGroupName) {
					if (childNodes[c].hasChildNodes) {
						var stereotypes = childNodes[c].childNodes;
						for ( var s = 0; s < stereotypes.length; s++) {
							var stereotypeName = stereotypes[s].getAttribute('name');
							// if review stereotype
							if (stereotypeName == 'review') {
								var properties = stereotypes[s].childNodes;
								for ( var p = 0; p < properties.length; p++) {
									if (properties[p].firstChild && properties[p].firstChild.nodeType == 1) {
										var name = properties[p].getAttribute('name');
										var collections = properties[p].childNodes;
										for ( var o = 0; o < collections.length; o++) {
											var review;
											if (reviewList.length > o)
												review = reviewList[o];
											else {
												review = new Review();
												reviewList.push(review);
											}
											review.no = o;
											eval('review.' + name + '=nodeValue(collections[' + o + ']);');
										}
									}
								}
								continue;
							}
							// continue on stereotype
							var stable = document.createElement('div');
							stable.className = 'nm-content table';
							var sthead = document.createElement('div');
							sthead.className = 'nm-content thead';
							sthead.appendChild(document.createTextNode(stereotypes[s].getAttribute('humanType') + ' '
								+ stereotypes[s].getAttribute('name')));
							stable.appendChild(sthead);
							var stbody = document.createElement('div');
							stbody.id = stereotypes[s].getAttribute('refid');
							stbody.className = 'nm-content tbody';
							stable.appendChild(stbody);
							content.appendChild(stable);
							var properties = stereotypes[s].childNodes;
							var customImageHolder = stereotypeName === 'CustomImageHolder';
							for ( var p = 0; p < properties.length; p++) {
								if (properties[p].firstChild && properties[p].firstChild.nodeType == 1) {
									var row = document.createElement('div');
									row.className = 'nm-content row';
									var label = document.createElement('label');
									label.className = 'nm-content';
									label.appendChild(document.createTextNode(properties[p].getAttribute('humanName')));
									row.appendChild(label);
									var separator = document.createElement('span');
									separator.className = 'nm-content col';
									separator.appendChild(document.createTextNode(' : '));
									row.appendChild(separator);
									var value = document.createElement('span');
									value.className = 'nm-content col';
									var collections = properties[p].childNodes;
									if (customImageHolder && properties[p].getAttribute('name') == 'Content') {
										var img = document.createElement('img');
										img.className = 'nm-content';
										img.setAttribute('src', nodeValue(collections[0]));
										value.appendChild(img);
									} else {
										for ( var o = 0; o < collections.length; o++) {
											if (collections[o].getAttribute('refid'))
												createLink(value, collections[o]);
											else
												renderValueNode(value, collections[o]);
											value.appendChild(document.createElement('br'));
										}
									}
									row.appendChild(value);
									stbody.appendChild(row);
								}
							}
						}
					}
					continue;
				} else if (childNodes[c].tagName == 'documentation') {
					var dtable = document.createElement('div');
					dtable.className = 'nm-content table';
					var dthead = document.createElement('div');
					dthead.className = 'nm-content thead';
					dthead.appendChild(document.createTextNode(childNodes[c].getAttribute('humanName')));
					dtable.appendChild(dthead);
					var dtbody = document.createElement('div');
					dtbody.id = 'documentationTable';
					dtbody.className = 'nm-content tbody';
					dtable.appendChild(dtbody);
					content.appendChild(dtable);
					var row = document.createElement('div');
					row.className = 'nm-content row';
					var value = document.createElement('div');
					value.className = 'nm-content documentation';
					renderValueNode(value, childNodes[c]);
					row.appendChild(value);
					dtbody.appendChild(row);
					continue;
				}
				// General Information
				if (childNodes[c].tagName == 'map' || childNodes[c].tagName == 'appearsIn')
					continue;
				var showProperty = false;
				if (content.mode == '')
					showProperty = true;
				else {
					var mode = childNodes[c].getAttribute('mode');
					if (mode)
						showProperty = mode.indexOf(content.mode) >= 0;
				}
				if (showProperty) {
					var row = document.createElement('div');
					row.className = 'nm-content row';
					var label = document.createElement('label');
					label.className = 'nm-content';
					label.appendChild(document.createTextNode(childNodes[c].getAttribute('humanName')));
					row.appendChild(label);
					var separator = document.createElement('span');
					separator.className = 'nm-content col';
					separator.appendChild(document.createTextNode(' : '));
					row.appendChild(separator);
					var value = document.createElement('span');
					value.className = 'nm-content col';
					if (childNodes[c].firstChild && childNodes[c].firstChild.nodeType == 1) {
						var collections = childNodes[c].childNodes;
						var cdiv = document.createElement('div');
						cdiv.className = 'nm-content none';
						cdiv.id = childNodes[c].getAttribute('humanName');
						if (collections.length > 1) {
							var img = document.createElement('img');
							img.src = Content.imgShow;
							img.alt = '';
							img.className = 'nm-content toggle';
							img.contentId = cdiv.id;
							img.onclick = function() {
								var content = new Content();
								content.imgHide = resourcesLocation + 'images/left_triangle.gif';
								content.showHide(this, this.contentId);
								repaint();
							};
							row.appendChild(img);
						}
						value.appendChild(cdiv);
						for ( var o = 0; o < collections.length; o++) {
							var humanType = collections[o].getAttribute('humanType');
							if (humanType)
								createLink(cdiv, collections[o]);
							else
								renderValueNode(cdiv, collections[o]);
							cdiv.appendChild(document.createElement('br'));
						}
					} else {
						var humanType = childNodes[c].getAttribute('humanType');
						if (humanType)
							createLink(value, childNodes[c]);
						else
							renderValueNode(value, childNodes[c]);
					}
					row.appendChild(value);
					tbody.appendChild(row);
				}
			}
		}
	}
	// review box
	renderReviewBox(reviewList);
}

/**
 * Appears in renderer.
 */
/**
 * Appears in renderer.
 */
function renderAppearsIn(model) {
	var content = document.getElementById('content');
	content.model = model;
	removeAll(content);
	content.appendChild(createActionBar(model));
	content.appendChild(createViewBar(model));
	var childNodes = model.childNodes;

	var appeartInText = TEXT.load(resourcesLocation + 'xml/appearIn.txt');

    var appearsInDiagram2 = new Array(0);
    var index = appeartInText.length;
    while(index > 0){
        index = appeartInText.lastIndexOf(model.id, index);
        if (index >= 0){
            var diagramIndex = appeartInText.lastIndexOf("=", index);
            index = diagramIndex;
            if (diagramIndex >= 0){
                var startDiagramIndex = appeartInText.lastIndexOf("^^", diagramIndex);
                index = startDiagramIndex;
                if (startDiagramIndex >= 0){
                    appearsInDiagram2[appearsInDiagram2.length] = appeartInText.substring(startDiagramIndex + 2, diagramIndex);
                }
            }
        }
        else
            break;
    }

    if (appearsInDiagram2.length > 0) {
        var atable = document.createElement('div');
        atable.className = 'nm-content table';
        var athead = document.createElement('div');
        athead.className = 'nm-content thead';
        athead.appendChild(document.createTextNode('Diagrams'));
        atable.appendChild(athead);
        var atbody = document.createElement('div');
        atbody.className = 'nm-content tbody';
        atable.appendChild(atbody);
        content.appendChild(atable);
        for ( var p = 0; p < appearsInDiagram2.length; p++) {
            var row = document.createElement('div');
            row.className = 'nm-content row';
            var name = document.createElement('span');
            name.className = 'nm-content';
            name.style.verticalAlign = 'middle';

            var diagramData = appearsInDiagram2[p].split("^");
            createLinkHTML(name, diagramData[0], diagramData[1], diagramData[3], diagramData[2]);

            row.appendChild(name);
            atbody.appendChild(row);
        }
    } else {
        var message = document.createElement('h5');
        message.className = 'nm-content';
        message.style.padding = '1em';
        message.appendChild(document.createTextNode('Selected element is not appeared in any diagram.'));
        content.appendChild(message);
    }

	/*var appearsInDiagram = new Array(0);
	for ( var c = 0; c < childNodes.length; c++) {
		if (childNodes[c].tagName == 'appearsIn') {
			var appearsInList = childNodes[c].childNodes;
			for ( var p = 0; p < appearsInList.length; p++) {
				if (appearsInList[p].tagName == 'diagram') {
					// format node name before add to appear in item list.
					var appersInItem = appearsInList[p];
					var appersInName = appersInItem.getAttribute('name');
					appersInItem.setAttribute('name', appersInName != "" ? appersInName : nonamedNode);

					appearsInDiagram[appearsInDiagram.length] = appersInItem;
				}
			}
			break;
		}
	}
	if (appearsInDiagram.length > 0) {
		var atable = document.createElement('div');
		atable.className = 'nm-content table';
		var athead = document.createElement('div');
		athead.className = 'nm-content thead';
		athead.appendChild(document.createTextNode('Diagrams'));
		atable.appendChild(athead);
		var atbody = document.createElement('div');
		atbody.className = 'nm-content tbody';
		atable.appendChild(atbody);
		content.appendChild(atable);
		for ( var p = 0; p < appearsInDiagram.length; p++) {
			var row = document.createElement('div');
			row.className = 'nm-content row';
			var name = document.createElement('span');
			name.className = 'nm-content';
			name.style.verticalAlign = 'middle';
			createLink(name, appearsInDiagram[p]);
			row.appendChild(name);
			atbody.appendChild(row);
		}
		repaint();
	} else {
		var message = document.createElement('h5');
		message.className = 'nm-content';
		message.style.padding = '1em';
		message.appendChild(document.createTextNode('Selected element is not appeared in any diagram.'));
		content.appendChild(message);
	}*/

}

function createContextItem(container, icon, label, func, href, refid) {
	var liitem = document.createElement('li');
	liitem.className = 'nm-content';
	var link = document.createElement('a');
	link.className = 'nm-content';
	if (href != null && href != "") {
		if (href.indexOf("file://") == 0)
			link.href = getFileURL(href.substring(7));
		else
			link.href = href;
		link.target = "_blank";
	} else {
		link.href = 'javascript:void(0);';
	}
	var linkIcon = document.createElement('img');
	linkIcon.className = 'nm-content';
	linkIcon.alt = '';
	linkIcon.border = '0';

	var imageFormat = "";
	if (icon)
		imageFormat = icon.substring(icon.lastIndexOf(".") + 1, icon.length);
	if (isIE() && !isResizableSVG(imageFormat)) {
		// Ignore icon width and height
	}
	else  {
		linkIcon.heigth = '16';
		linkIcon.width = '16';
	}
	linkIcon.style.padding = '2px 5px 2px 5px';
	if (refid != null && refid != "")
		linkIcon.refid = refid;
//	linkIcon.onclick = func;
	linkIcon.src = icon;
	if (refid != null && refid != "")
		link.refid = refid;
	link.onclick = func;
	link.appendChild(linkIcon);
	link.appendChild(document.createTextNode(label));
	liitem.appendChild(link);
	if (container != null) {
		var i = container.hasChildNodes() ? container.childNodes.length : 0;
		liitem.id = 'elementContextItem' + i;
		linkIcon.id = 'elementContextItemIcon' + i;
		link.id = 'elementContextItemLink' + i;
		container.appendChild(liitem);
	}
	return liitem;
}

/**
 * Diagram specification renderer.
 */

function renderDiagram(model, diagamModel) {
	var specIcon;
	var content = document.getElementById('content');
	content.model = model;
	content.diagamModel = diagamModel;
	removeAll(content);
	content.appendChild(createActionBar(model));
	content.appendChild(createViewBar(model));
	if (diagamModel)
		model = diagamModel;

	showPropertiesTab(model);
	propertiesRendered = false;

	var header = document.createElement('h2');
	header.className = 'nm-content';
	header.id = 'contentHeader';
	header.appendChild(document.createTextNode(model.getAttribute('diagramType')));
	if (navigator.userAgent.indexOf('MSIE 6') >= 0)
		header.style.marginTop = '2em';
	content.appendChild(header);
	var mapName;
	var areas;
	var ulcontext = null;
	if (model.hasChildNodes) {
		mapName = 'map_' + model.getAttribute('id');
		var childNodes = model.childNodes;
		for ( var c = 0; c < childNodes.length; c++) {
			if (childNodes[c].tagName == 'name')
				header.appendChild(document.createTextNode(' ' + nodeValue(childNodes[c])));
			else if (childNodes[c].tagName == 'map') {
				var map = document.createElement('map');
				map.className = 'nm-content';
				map.id = mapName;
				map.setAttribute('name', mapName);
				if (childNodes[c].hasChildNodes) {
					areas = childNodes[c].childNodes;
					var elementArea = new Array();
					for (a = 0; a < areas.length; a++) {
						elementArea[a] = document.createElement('area');
						elementArea[a].className = 'nm-content';
						elementArea[a].shape = 'poly';
						elementArea[a].alt = areas[a].getAttribute('name');
						elementArea[a].id = a;
						elementArea[a].href = 'javascript:void(0);';
						elementArea[a].ondblclick = function(e) {
							var type = areas[this.id].getAttribute('type');
							var elementId = areas[this.id].getAttribute('refid');
							var isNotContentShape = areas[this.id].getAttribute('isNotContentShape');
							var isHyperlink = areas[this.id].getAttribute('isHyperlink');
							if (isHyperlink == true || isHyperlink == "true") {
								url = areas[this.id].getAttribute('linkUrl');
								if (url.indexOf("file://") == 0) {
									url = getFileURL(url.substring(7));
								}
								window.open('','_blank').location.href = url;
								return false;
							}
							// for textbox, note
							// fix bug when isNotContentShape is not defined in xml
							else if (isNotContentShape == true || isNotContentShape == "true") {
								if (type == 1 || type == 2) { // link or file
									//window.open(elementId, '_blank');
									// http://www.dynamicdrive.com/forums/entry.php?256-Force-a-page-to-open-in-a-new-tab
									// Fixed IE does not open new tab when the address is invalid
									window.open('','_blank').location.href = elementId;
									return false;
								}
								// // TODO support navigation
								// else if (type == 3) {// navigation
								//	// Now, do nothing
								// }
								//
								else { // elelment
									showSpec(elementId);
								}
							}
							else {
								gotoElement(elementId, false);
							}
						};
						elementArea[a].onmousedown = function(e) {
							var evt = getEvent(e);
							var elementId = areas[this.id].getAttribute('refid');
							var type = areas[this.id].getAttribute('type');
							var isNotContentShape = areas[this.id].getAttribute('isNotContentShape');
							var isHyperlink = areas[this.id].getAttribute('isHyperlink');
							var id = this.id
							// for textbox, note
							if (isNotContentShape == true || isNotContentShape == "true") {
								if (type == 1 || type == 2) { // goto link or file
									//window.open(elementId, '_blank');
									// http://www.dynamicdrive.com/forums/entry.php?256-Force-a-page-to-open-in-a-new-tab
									// Fixed IE does not open new tab when the address is invalid
									window.open('','_blank').location.href = elementId;
									return false;
								}
								else {
									ulcontext = createULContext();

									var elementIds = elementId;
									var elementsArray = [];

									// // TODO support navigation
									// if (type == 3)
									// 	elementsArray = elementId.split("&");
									// else
									//
									elementsArray.push(elementIds);

									var arrayLength = elementsArray.length;
									var foundItem = true;
									for (var i = 0; i < arrayLength; i++) {
										var anElementId = elementsArray[i];
										XMLRequest.send(resourcesLocation + 'xml/' + anElementId + '.xml', function(responseXML) {
											if (responseXML) {
												var magicdraw = responseXML.getElementsByTagName('magicdraw')[0];
												if (magicdraw != null) {
													var model = firstChild(magicdraw);
													var specIcon = model.getAttribute('icon');

													var elementName = responseXML.getElementsByTagName('name')[0];
													var name = "";
													if (elementName)
														name = nodeValue(elementName);

													var liitem = createContextItem(ulcontext, specIcon, 'Go to '
															+ name, function() {
															showSpec(anElementId);
													});

												}
												else if (arrayLength == 1) {
													alert('This element was not generated from project.');
													foundItem = false;
												}
											}
											else if (arrayLength == 1) {
												alert('This element was not generated from project.');
												foundItem = false;
											}
										});
									}

									if (arrayLength > 0 && foundItem) {
										showContext(evt, content, ulcontext);
									}
								}
							}
							else if (usecontextmenu) {
								if (isHyperlink == true || isHyperlink == 'true') {
									ulcontext = createULContext();

									var name = areas[this.id].getAttribute('linkUrl');
									if (name.indexOf("file://") == 0) {
										name = getFileURL(name.substring(7));
									}
									var liitem = createContextItem(ulcontext, resourcesLocation + 'images/hyperlink_url.gif',  name,
											function() {
												var elementContext = document.getElementById('elementcontextmenu');
												if (elementContext) {
													elementContext.style.visibility = 'hidden';
													Shadow.removeShadow(elementContext);
												}
											}, name);

									// show context menu
									showContext(evt, content, ulcontext);
								}
								else {
									XMLRequest.send(resourcesLocation + 'xml/' + elementId + '.xml', function(responseXML) {
										var hyperlinkModel = new Array();
										var hyperlinkText = new Array();
										var referTo = new Array();
										var hyperlinkModelActive;
										var hyperlinkTextActive;
										var magicdraw;
										var isShowMenu = true;
										if (responseXML)
											magicdraw = responseXML.getElementsByTagName('magicdraw')[0];
										if (magicdraw != null) {
											var model = firstChild(magicdraw);
											specIcon = model.getAttribute('icon');
											hyperlinkModelActive = getActiveHyperlinkModel(model);
										}
										var model = null;
										if (magicdraw != null) {
											model = firstChild(magicdraw);
											showSpecForProperties(areas[id].getAttribute('refid'));
											if (model.hasChildNodes) {
												var doc;
												var humanName = model.getAttribute("humanType");
												var childNodes = model.childNodes;
												for ( var i = 0; i < childNodes.length; i++) {
													if (childNodes[i].tagName == appliedStereotyeGroupName) {
														if (childNodes[i].hasChildNodes) {
															var stereotypes = childNodes[i].childNodes;
															for (s = 0; s < stereotypes.length; s++) {
																var stereotypesName = stereotypes[s].getAttribute('name')
																if (stereotypesName == 'HyperlinkOwner') {
																	if (stereotypes[s].hasChildNodes) {
																		var properties = stereotypes[s].childNodes;
																		for (p = 0; p < properties.length; p++) {
																			var propertyName = properties[p].getAttribute('name');
																			if (propertyName == 'hyperlinkModel') {
																				if (properties[p].hasChildNodes) {
																					var elements = properties[p].childNodes;
																					for ( var e = 0; e < elements.length; e++) {
																						if (elements[e].tagName == "String" && elements[e].hasChildNodes())
																						{
																							var linkText = elements[e].childNodes;
																							if (hyperlinkModelActive == null || linkText[0].nodeValue != hyperlinkModelActive.id)
																							{
																								hyperlinkText.push(new ModelLink(
																									linkText[0].nodeValue, linkText[0].nodeValue,
																									resourcesLocation + 'images/hyperlink_url.gif',
																									false))
																							}
																						}
																						else
																						{
																						var refid = elements[e].getAttribute('refid');
																							if (hyperlinkModelActive == null || refid != hyperlinkModelActive.id)
																							{
																							hyperlinkModel.push(new ModelLink(refid, elements[e]
																								.getAttribute('name'), elements[e]
																									.getAttribute('icon'), true))
																							}
																						}
																					}
																				}
																			} else if (propertyName == 'hyperlinkText') {
																				if (properties[p].hasChildNodes) {
																					var elements = properties[p].childNodes;
																					for ( var e = 0; e < elements.length; e++) {
																						if (elements[e].tagName == "String") {
																							if (elements[e].hasChildNodes()) {
																								var linkText = elements[e].childNodes;
																								hyperlinkText.push(new ModelLink(
																									linkText[0].nodeValue, linkText[0].nodeValue,
																									resourcesLocation + 'images/hyperlink_url.gif',
																									false))
																							}
																						} else {
																							var refid = elements[e].getAttribute('refid');
																							if (hyperlinkModelActive && hyperlinkModelActive.id) {
																								if (refid != hyperlinkModelActive.id) {
																									hyperlinkText.push(new ModelLink(refid,
																										elements[e].getAttribute('name'),
																										elements[e].getAttribute('icon'), true))
																								}
																							} else {
																								hyperlinkText.push(new ModelLink(refid,
																									elements[e].getAttribute('name'), elements[e]
																										.getAttribute('icon'), true))
																							}
																						}
																					}
																				}
																			} else if (propertyName == 'hyperlinkTextActive') {
																				if (properties[p].hasChildNodes) {
																					var elements = properties[p].childNodes;
																					for ( var e = 0; e < elements.length; e++) {
																						if (elements[e].tagName == "String") {
																							if (elements[e].hasChildNodes) {
																								var linkText = elements[e].childNodes;
																								hyperlinkTextActive = new ModelLink(
																									linkText[0].nodeValue, linkText[0].nodeValue,
																									resourcesLocation + 'images/hyperlink_url.gif',
																									false);
																							}
																						} else {
																							var refid = elements[e].getAttribute('refid');
																							if (hyperlinkModelActive && hyperlinkModelActive.id) {
																								if (refid != hyperlinkModelActive.id) {
																									hyperlinkTextActive = new ModelLink(refid,
																										elements[e].getAttribute('name'),
																										elements[e].getAttribute('icon'), true);

																								}
																							} else {
																								hyperlinkTextActive = new ModelLink(refid,
																									elements[e].getAttribute('name'), elements[e]
																										.getAttribute('icon'), true);
																							}
																						}
																					}
																				}
																			}
																		}
																	}
																}
															}
														}
													}
													else if (childNodes[i].tagName == 'refersTo') {
														var referId = childNodes[i].getAttribute('refid');
														var referIcon = childNodes[i].getAttribute('icon');
														var referName = childNodes[i].getAttribute('name');
														referTo.push(new ModelLink(referId, referName, referIcon, true));
													}
												}
											}
										}

										ulcontext = createULContext();

										var foundOtherLink = false;
										// specification
										var liitem = createContextItem(ulcontext, specIcon, 'Specification', function() {
											showSpec(areas[id].getAttribute('refid'));
										});
										// active model
										if (hyperlinkModelActive) {
											if (!hyperlinkModelActive.isModel) {
												liitem = createContextItem(ulcontext, hyperlinkModelActive.icon,
													hyperlinkModelActive.name, function() {
														var elementContext = document.getElementById('elementcontextmenu');
														if (elementContext) {
															elementContext.style.visibility = 'hidden';
															Shadow.removeShadow(elementContext);
														}
													}, hyperlinkModelActive.name);
											} else {
											liitem = createContextItem(ulcontext, hyperlinkModelActive.icon, 'Go to '
												+ hyperlinkModelActive.name, function() {
												gotoElement(areas[id].getAttribute('refid'), false, true);
											});
										}
											foundOtherLink = true;
										}
										// active text
										if (hyperlinkTextActive) {
											if (!hyperlinkTextActive.isModel) {
												liitem = createContextItem(ulcontext, hyperlinkTextActive.icon,
													hyperlinkTextActive.name, function() {
														var elementContext = document.getElementById('elementcontextmenu');
														if (elementContext) {
															elementContext.style.visibility = 'hidden';
															Shadow.removeShadow(elementContext);
														}
													}, hyperlinkTextActive.name);
											} else {
												liitem = createContextItem(ulcontext, hyperlinkTextActive.icon, 'Go to '
													+ hyperlinkTextActive.name, function() {
													gotoElement(hyperlinkTextActive.id, false, true);
												});
											}
											foundOtherLink = true;
										}
										// model links
										var liitemIndex = liitem.length;
										for ( var h = 0; h < hyperlinkModel.length; h++) {
											liitem = createContextItem(ulcontext, hyperlinkModel[h].icon, 'Go to '
												+ hyperlinkModel[h].name, function() {
												showSpec(this.refid);
											}, "", hyperlinkModel[h].id);
											foundOtherLink = true;
										}
										// text links
										var liitemIndex = liitem.length;
										for ( var h = 0; h < hyperlinkText.length; h++) {
											if (hyperlinkTextActive == null || hyperlinkText[h].id != hyperlinkTextActive.id) {
												if (!hyperlinkText[h].isModel) {
													liitem = createContextItem(ulcontext, hyperlinkText[h].icon, hyperlinkText[h].name,
														function() {
															var elementContext = document.getElementById('elementcontextmenu');
															if (elementContext) {
																elementContext.style.visibility = 'hidden';
																Shadow.removeShadow(elementContext);
															}
														}, hyperlinkText[h].name);
												} else {
													liitem = createContextItem(ulcontext, hyperlinkText[h].icon, 'Go to '
														+ hyperlinkText[h].name, function() {
														gotoElement(this.refid, false, true);
													}, "", hyperlinkText[h].id);
												}
												foundOtherLink = true;
											}
										}

										// referItem
										var liitemIndex = liitem.length;
										for ( var h = 0; h < referTo.length; h++) {
											liitem = createContextItem(ulcontext, referTo[h].icon, 'Go to '
												+ referTo[h].name, function() {
												gotoElement(this.refid, false, true);
											}, "", referTo[h].id);
											foundOtherLink = true;
										}

										if (model) {
											var classType = model.getAttribute('classType');
											if (classType == 'State') {
												var submachineTags = model.getElementsByTagName('submachine');
												if (submachineTags.length > 0) {
													liitem = createContextItem(ulcontext, submachineTags[0].getAttribute('icon'),
														'Go to ' + submachineTags[0].getAttribute('name'), function() {
															gotoElement(submachineTags[0].getAttribute('refid'), false, true);
														});
													foundOtherLink = true;
												}
											} else if (classType == 'CallBehaviorAction') {
												var behaviorTags = model.getElementsByTagName('behavior');
												if (behaviorTags.length > 0) {
													liitem = createContextItem(ulcontext, behaviorTags[0].getAttribute('icon'),
														'Go to ' + behaviorTags[0].getAttribute('name'), function() {
															gotoElement(behaviorTags[0].getAttribute('refid'), false, true);
														});
													foundOtherLink = true;
												}
											} else if (classType == 'Diagram' && !foundOtherLink) {
												isShowMenu = false;
											}
										}

										if (isShowMenu) {
											showContext(evt, content, ulcontext);
										}
										else {
											showSpec(areas[id].getAttribute('refid'));
										}
									});
								}
							} else {
								gotoElement(elementId, false);
							}
						}
						var points = areas[a].childNodes;
						var coordsString = "";
						/*
						//// old code
						for ( var p = 0; p < points.length; p++, coordsString += ',') {
							coordsString += points[p].getAttribute('x') + ',' + points[p].getAttribute('y');
						}
						coordsString += points[0].getAttribute('x') + ',' + points[0].getAttribute('y');
						*/
						// fixed https://jira.nomagic.com/browse/MGRP-3657
						var coordsList = [];
						for ( var p = 0; p < points.length; p++) {
							coordsList.push(new Point(p, points[p].getAttribute('x'), points[p].getAttribute('y')));
						}

						// fixed https://jira.nomagic.com/browse/MGRP-4085
						if (coordsList.length == 4)
							sortPoint(coordsList);

						for ( var p = 0; p < coordsList.length; p++, coordsString += ',') {
							coordsString += coordsList[p].pointX + ',' + coordsList[p].pointY;
						}
						elementArea[a].coords = coordsString;
						map.appendChild(elementArea[a]);
					}
				}
				content.appendChild(map);
			}
		}
	}

	document.body.onmousedown = function(e) {
		var evt = getEvent(e);
		var target = evt.target ? evt.target : evt.srcElement;
		var targetNodeName = target.nodeName;
		var targetNodeId = target.id;

		if (!(targetNodeName == "AREA" || (targetNodeId != null && targetNodeId.indexOf("elementContextItem") == 0))) {
			var contextMenu = document.getElementById('elementcontextmenu');
			if (contextMenu) {
				contextMenu.style.disply = 'none';
				contextMenu.style.visibility = 'hidden';
				Shadow.removeShadow(contextMenu);
			}
		}
	}

	var diagramContainer = document.createElement('div');
	diagramContainer.className = 'nm-content';
	diagramContainer.id = 'diagramContainer';
	var imagePath = model.getAttribute('src');
	var imageFormat = imagePath.substring(imagePath.lastIndexOf(".") + 1, imagePath.length);
	var image;
	if (isResizableSVG(imageFormat)) {
		// create image tag for resizing svg
		image = document.createElement('object');
		image.className = 'nm-content';
		image.type = "image/svg+xml";
		image.data = model.getAttribute('src');

		if (isIE())
		{
			//diagramContainer.style.maxWidth = model.getAttribute('width') + 'px';
			diagramContainer.style.top='0';
			diagramContainer.style.left='0';
			diagramContainer.style.rigth='0';
			diagramContainer.style.position='relative';
			diagramContainer.style.left='50%';
			diagramContainer.style.transform='translateX(-50%)';

			image.style.width = '100%';
		}
		else
		{
			image.style.maxWidth = '100%';
			image.style.maxHeight = 'auto';
		}
	}
	else {
		// create image tag
		image = document.createElement('img');
		image.className = 'nm-content';
		//image.width = model.getAttribute('width');
		//image.height = model.getAttribute('height');
	}
	image.src = model.getAttribute('src');
	image.alt = '';
	// model.getAttribute('diagramType');
	image.border = '0';
	image.className = 'diagram';
	if (mapName)
		image.useMap = '#' + mapName;
	diagramContainer.appendChild(image);
	content.appendChild(diagramContainer);
}


function createULContext() {
	ulcontext = document.getElementById('elementcontextmenu');
	if (typeof ulcontext == 'undefined' || ulcontext == null) {
		ulcontext = document.createElement('ul');
		ulcontext.id = 'elementcontextmenu';
		ulcontext.className = 'nm-content contextMenu';
	}
	removeAll(ulcontext);

	return ulcontext;
}

function showContext(evt, content, ulcontext) {
	// show context menu
	var mic = Graphics.mousePosition(evt);
	var mouseX = mic.x + 2;
	var mouseY = mic.y + 2;
	ulcontext.style.position = 'absolute';
	ulcontext.style.left = mouseX + 'px';
	ulcontext.style.top = mouseY + 'px';
	ulcontext.style.display = 'block';
	ulcontext.style.visibility = 'visible';
	ulcontext.style.zIndex = (content.style.zIndex ? content.style.zIndex : 133) + 100;
	content.appendChild(ulcontext);
	Shadow.castShadow(ulcontext);
}

/**
 * Point object
 *
 * @param label name of point
 * @param lat latitude (x)
 * @param lon longitude (y)
 * @return Point object
 */
function Point(label, lat, lon) {

    this.label = label;
	this.pointX = lat;
	this.pointY = lon;
    this.x = (lon + 180) * 360;
    this.y = (lat + 90) * 180;

    this.distance=function(that) {
        var dX = that.x - this.x;
        var dY = that.y - this.y;
        return Math.sqrt((dX*dX) + (dY*dY));
    }

    this.slope=function(that) {
        var dX = that.x - this.x;
        var dY = that.y - this.y;
        return dY / dX;
    }

    this.toString=function() {
        return this.label;
    }
}

/**
 * A custom sort function that sorts p1 and p2 based on their slope that is formed from the upper most point from the array of points.
 *
 * @param pointList list of Point
 */
function sortPoint(pointList){
	var upper = upperLeft(pointList);
	pointList.sort(function(p1, p2) {
		// Exclude the 'upper' point from the sort (which should come first).
		if(p1 == upper) return -1;
		if(p2 == upper) return 1;

		// Find the slopes of 'p1' and 'p2' when a line is
		// drawn from those points through the 'upper' point.
		var m1 = upper.slope(p1);
		var m2 = upper.slope(p2);

		// 'p1' and 'p2' are on the same line towards 'upper'.
		if(m1 == m2) {
			// The point closest to 'upper' will come first.
			return p1.distance(upper) < p2.distance(upper) ? -1 : 1;
		}

		// If 'p1' is to the right of 'upper' and 'p2' is the the left.
		if(m1 <= 0 && m2 > 0) return -1;

		// If 'p1' is to the left of 'upper' and 'p2' is the the right.
		if(m1 > 0 && m2 <= 0) return 1;

		// It seems that both slopes are either positive, or negative.
		return m1 > m2 ? -1 : 1;
	});
}

/**
 * Find the upper most point. In case of a tie, get the left most point.
 *
 * @param points list of Point
 * @return the upper most point
 */
function upperLeft(points) {
    var top = points[0];
    for(var i = 1; i < points.length; i++) {
        var temp = points[i];
        if(temp.y > top.y || (temp.y == top.y && temp.x < top.x)) {
            top = temp;
        }
    }
    return top;
}

/**
 * Return an active hyperlink attached to this model.
 *
 * @param {HTML} model
 * @return ModelLink or null
 */

function getActiveHyperlinkModel(model) {
	if (model && model.hasChildNodes) {
		var childNodes = model.childNodes;
		for ( var i = 0; i < childNodes.length; i++) {
			if (childNodes[i].tagName == appliedStereotyeGroupName) {
				if (childNodes[i].hasChildNodes) {
					var stereotypes = childNodes[i].childNodes;
					for (s = 0; s < stereotypes.length; s++) {
						var stereotypesName = stereotypes[s].getAttribute('name')
						if (stereotypesName == 'HyperlinkOwner') {
							if (stereotypes[s].hasChildNodes) {
								var properties = stereotypes[s].childNodes;
								for (p = 0; p < properties.length; p++) {
									var propertyName = properties[p].getAttribute('name');
									if (propertyName == 'hyperlinkModelActive') {
										if (properties[p].hasChildNodes) {
											var element = properties[p].childNodes;
											if (element[0] != null)
											{
												if (element[0].tagName == "String" && element[0].hasChildNodes())
												{
													var linkText = element[0].childNodes;
													return new ModelLink(
														linkText[0].nodeValue, linkText[0].nodeValue,
														resourcesLocation + 'images/hyperlink_url.gif',
														false)
												}
												else
												{
												return new ModelLink(element[0].getAttribute('refid'), element[0]
														.getAttribute('name'), element[0].getAttribute('icon'), true);

												}
											}
										}
									}
								}
							}
						}
					}
				}
			}
		}
	}
	return null;
}

/**
 * Append a review box to table.
 */

function renderReviewBox(reviewList) {
	var content = document.getElementById('content');
	// render review history
	if (reviewList.length > 0) {
		var rtable = document.createElement('div');
		rtable.className = 'nm-content table';
		var rthead = document.createElement('div');
		rthead.className = 'nm-content thead';
		rthead.appendChild(document.createTextNode('Review'));
		rtable.appendChild(rthead);
		var rtbody = document.createElement('div');
		rtbody.id = 'reviewHistoryTable';
		rtbody.className = 'nm-content tbody';
		rtable.appendChild(rtbody);
		content.appendChild(rtable);
		for ( var i = 0; i < reviewList.length; i++) {
			var review = reviewList[i];
			var row = document.createElement('div');
			row.className = 'nm-content row';
			var valueSect = document.createElement('span');
			valueSect.className = 'nm-content';
			var text = review.text;
			var startBodyIndex = text.indexOf('<body>');
			var endBodyIndex = text.indexOf('</body>', startBodyIndex);
			if (startBodyIndex > 0 && endBodyIndex > 0)
				text = text.substring(startBodyIndex, endBodyIndex);
			valueSect.innerHTML = review.text;
			var authorSect = document.createElement('p');
			authorSect.className = 'nm-content';
			authorSect.style.marginTop = '20px';
			authorSect.style.fontStyle = 'italic';
			authorSect.style.color = '#888888';
			authorSect.appendChild(document.createTextNode(review.author + ' (' + review.date + ' )'));
			valueSect.appendChild(authorSect);
			row.appendChild(valueSect);
			rtbody.appendChild(row);
		}
	}
}

/**
 * Goto element.
 *
 * @elementId element id
 */

function gotoElement(elementId, keepStack, userClick) {
	if (keepStack) {
		usehyperlink = false;
		useStack = keepStack;
		XMLRequest.send(resourcesLocation + 'xml/' + elementId + '.xml', renderModel);
	} else {
		if (userClick) {
			gotoElementArray = new Array();
		}
		// Check array of go to element. If element id is existed (Infinite loop of go to element is occurred.), stop goto
		// element path.
		if (getIndexOfArray(gotoElementArray, elementId) > -1) {
			// Show specification of last recent element in array of goto element.
			usehyperlink = false;
			useStack = keepStack;
			XMLRequest.send(resourcesLocation + 'xml/' + gotoElementArray[gotoElementArray.length - 1] + '.xml',
				renderModel);
			//Reset array of go to element.
			gotoElementArray = new Array();
			return;
		}
		usehyperlink = true;
		useStack = keepStack;
		gotoElementArray.push(elementId);
		XMLRequest.send(resourcesLocation + 'xml/' + elementId + '.xml', renderModel);
	}
}

/**
 * Show element's specification page
 *
 * @param elementId element id
 * @param keepStack put command into undo stack
 */

function showSpec(elementId, keepStack) {
	usehyperlink = false;
	useStack = keepStack;
	XMLRequest.send(resourcesLocation + 'xml/' + elementId + '.xml', renderModel);
}

/**
 * Expand node path
 */

function expandPath(nodePath, selectInTree) {
	showLoading(true);
	stopexpand = false;

	var path = nodePath.length - 1;
	var aTree;
	// TODO check root for other tab
	if (activeTab && activeTab.id == "diagrams_tab") {
		rootTree = document.getElementById(diagramsTree.treeId);
		aTree = diagramsTree;
	}
	else if (!activeTab || activeTab.id == "containment_tab") {
		rootTree = document.getElementById(tree.treeId);
		aTree = tree;
	}
	else {
		for (var i = activeTabStack.length - 1; i >= 0; i--) {
			if (activeTabStack[i] == 'containment') {
				rootTree = document.getElementById(tree.treeId);
				aTree = tree;
				showContainmentTab(false);
				break;
			}
			else {
				var tabid = activeTabStack[i];
				var treeid = tabid + "_tree";
				rootTree = document.getElementById(treeid);

				if (rootTree) {
					var found = false;
					var rootElement = rootTree.rootElement;
					if (rootElement) {
						for (var j = nodePath.length - 1 ; j >= 0; j--) {
							if (rootElement == nodePath[j]) {
								found = true;
								path = j;
								showContainmentTab(false, tabid);
								// find tree
								for (var k = 0; k < tabs.length; k++) {
									if (tabs[k].id == tabid) {
										aTree = tabs[k].tree;
										break;
									}
								}
								break;
							}
						}
					}

					if (found) {
						break;
					}
				}
			}
		}
	}

	internalExpandPath(aTree, rootTree, nodePath, path, selectInTree);
	hideLoading(true);
}

/**
 * we already found node stop searching and collapse investigating node
 */
var stopexpand = false;

function internalExpandPath(aTree, rootNode, nodePath, path, selectInTree) {
	if (path < 0 || stopexpand) {
		if (path < 0) {
			if (selectInTree) {
				if (rootNode) {
					stopexpand = true;
					selectNode(rootNode);
					// Expand tree after select node for fixed problem form first select time.
					var treepath = nodePath.length - 1;
					expandTree(rootNode, nodePath, treepath);
					return;
				}
			}
		}
		return;
	}
	var childNodes = rootNode.childNodes;
	var content = document.getElementById('content');
	if (childNodes) {
		for ( var c = 0; c < childNodes.length; c++) {
			if (childNodes[c].tagName == 'UL') {
				internalExpandPath(aTree, childNodes[c], nodePath, path, selectInTree);
			} else if (childNodes[c].tagName == 'LI') {
				var refid = childNodes[c].getAttribute('refid');
				childNodes[c].internalExpand = false;
				if (refid == 'relations') {
					// if node already expand, left it expand
					if (childNodes[c].lastChild && !childNodes[c].lastChild.isExpanded) {
						childNodes[c].path = path;
						aTree.expand(childNodes[c]);
						// mark as node is expanded for investigating
						childNodes[c].internalExpand = true;
					}
					internalExpandPath(aTree, childNodes[c], nodePath, path, selectInTree);
				} else if (refid == nodePath[path]) {
					// if node already expand, left it expand
					if (childNodes[c].lastChild && !childNodes[c].lastChild.isExpanded) {
						if (childNodes[c].lastChild.tagName == "UL") {
							if (childNodes[c].lastChild.hasChildNodes()) {
								aTree.expand(childNodes[c]);
								childNodes[c].internalExpand = true;
								var nextPath = path - 1;
								internalExpandPath(aTree, childNodes[c], nodePath, nextPath, selectInTree);

							} else {
								// If tagname is UL, call function expand node;
								childNodes[c].path = path;
								childNodes[c].onReady = function() {
									var nextPath = this.path - 1;
									internalExpandPath(aTree, this, nodePath, nextPath, selectInTree);
									// mark as node is expanded for investigating
									this.internalExpand = true;
								}
								aTree.expand(childNodes[c]);
							}
						} else {
							// If tagname isn't UL, expand node function doesn't exist;
							var nextPath = path - 1;
							internalExpandPath(aTree, childNodes[c].lastChild, nodePath, nextPath, selectInTree);
						}
					} else {
						internalExpandPath(aTree, childNodes[c], nodePath, --path, selectInTree);
					}
				}
				if (path == -1) {
					stopexpand = true;
				}
				if (!stopexpand) {
					// collapse node that use for investigating.
					if (childNodes[c].internalExpand) {
						aTree.collapse(childNodes[c]);
					}
				}
			}
		}
	}
}

/**
 * Function for expand tree.
 */
var stopexpandtree = false;

function expandTree(node, nodePath, path) {
	if (path < 0 || stopexpandtree)
		return;
	var childNodes = node.childNodes;
	if (childNodes) {
		for ( var i = 0; i < childNodes.length; i++) {
			var child = childNodes[i];
			if (child.tagName == 'UL')
				expandTree(child, nodePath, path);
			else if (child.tagName == 'LI') {
				var refid = child.getAttribute('refid');
				child.internalExpand = false;
				if (refid == 'relations') {
					// if node already expand, left it expand
					if (child.lastChild && !child.lastChild.isExpanded) {
						tree.expand(child);
						// mark as node is expanded for investigating
						child.internalExpand = true;
					}
					expandTree(child, nodePath, path);
				} else if (refid == nodePath[path]) {
					// if node already expand, left it expand
					if (child.lastChild && !child.lastChild.isExpanded) {
						tree.expand(child);
						// mark as node is expanded for investigating
						child.internalExpand = true;
					}
					expandTree(child, nodePath, --path);
				}
				// if found target node then stop expanding
				if (path == -1)
					stopexpandtree = true;
				if (!stopexpandtree) {
					// collapse node that use for investigating.
					if (child.internalExpand)
						tree.collapse(child);
				}
			}
		}
	}
}

/**
 * Goto last visit page
 */

function back() {
	if (backStack.size() == 1)
		return;
	backStack.pop();
	var backPageId = backStack.pop();
	if (backStack.size() < 1) {
		var backButton = document.getElementById('backButton');
		backButton.className = 'backDisabled';
	}
	if (backPageId) {
		forwardStack.push(currentPageId);
		var forwardButton = document.getElementById('forwardButton');
		forwardButton.className = 'forward';
		// showSpec(backPageId, true);
		gotoElement(backPageId, true, true);

		if (selecthistorynode){
			findNodeForSelected(backPageId, true);
		}
	}
}

/**
 * Forward to next visit page
 */

function forward() {
	var forwardPageId = forwardStack.pop();
	if (forwardStack.size() < 1) {
		var forwardButton = document.getElementById('forwardButton');
		forwardButton.className = 'forwardDisabled';
	}
	if (forwardPageId) {
		gotoElement(forwardPageId, true, true);

		if (selecthistorynode){
			findNodeForSelected(forwardPageId, true);
		}
	}
}

/**
 * Trim string
 *
 * @param input string
 * @return output string
 */

function trim(aB) {
	return aB.replace(/^\s*|\s*$/g, '');
}

/**
 * Test matches node with regular expression
 */
function match(node, attr, regx, searchResults) {
	// if (node.tagName == 'ownedDiagram')
	// return;
	if (node.nodeType == 1) {
		var name = node.getAttribute(attr);
		if ((name == '' || name) && regx.test(name))
			searchResults[searchResults.length] = node;
	}
	if (node.hasChildNodes()) {
		var childNodes = node.childNodes;
		for ( var i = 0; i < childNodes.length; i++)
			match(childNodes[i], attr, regx, searchResults);
	}
}

/**
 * Test matches node with string compare
 */
function findNodeByAttribute(node, attr, value, searchResults, maxresult) {
	// if (node.tagName == 'ownedDiagram')
	// return;
	if (maxresult && searchResults.length >= maxresult) {
		// stop search
		return;
	}

	if (node.nodeType == 1) {
		var v = node.getAttribute(attr);
		if (v == value)
			searchResults[searchResults.length] = node;
	}
	if (node.hasChildNodes()) {
		var childNodes = node.childNodes;
		for ( var i = 0; i < childNodes.length; i++)
			findNodeByAttribute(childNodes[i], attr, value, searchResults, maxresult);
	}
}

/**
 * Search function. Regular expression can be used with element name.
 *
 * @param elementName name of element being search.
 */
function search(elementName) {

	if (tree.root) {
		// Use existing data.xml if this file used to be load.
		if (tree.root.index) {
			showLoading();
			var dataModel = tree.root.index;
			createSearchContent(dataModel, elementName);
			hideLoading();
		}
		// Load data.xml file.
		else {
			XMLRequest.send(resourcesLocation + 'xml/' + 'data.xml', function(responseXML) {
				var magicdraw;
				if (responseXML)
					magicdraw = responseXML.getElementsByTagName('magicdraw')[0];
				if (magicdraw != null) {
					// set data.xml to tree.root.index
					tree.root.index = responseXML;
					var elementName = document.getElementById('searchText').value;
					showLoading();
					var dataModel = firstChild(magicdraw);
					createSearchContent(dataModel, elementName);
					hideLoading();
				}

			}, false, true);
		}
	}
}

// Create content of search result.
function createSearchContent(dataModel, elementName) {
	var regx;
	try {
		regx = new RegExp(trim(elementName), 'i');
	} catch (e) {
		alert('Invalid search pattern \nReason: ' + e.message
			+ '\nPlease validate regular expression syntax in search text');
	}
	if (regx) {
		var searchResults = new Array(0);
		match(dataModel, 'name', regx, searchResults);
		var content = document.getElementById('content');
		removeAll(content);
		var header = document.createElement('h2');
		header.className = 'nm-content';
		header.id = 'contentHeader';
		header.appendChild(document.createTextNode('Search Results'));
		content.appendChild(header);
		if (searchResults.length > 0) {
			var stable = document.createElement('div');
			stable.className = 'nm-content table';
			var sthead = document.createElement('div');
			sthead.className = 'nm-content thead';
			sthead.appendChild(document.createTextNode('Search Results'));
			stable.appendChild(sthead);
			var stbody = document.createElement('div');
			stbody.className = 'nm-content tbody';
			stable.appendChild(stbody);
			content.appendChild(stable);
			for ( var p = 0; p < searchResults.length; p++) {
				if (searchResults[p].nodeType == 1) {
					var row = document.createElement('div');
					row.className = 'nm-content row';
					var name = document.createElement('span');
					name.className = 'nm-content';
					name.style.verticalAlign = 'middle';
					createLink(name, searchResults[p]);
					row.appendChild(name);
					var type = document.createElement('span');
					type.className = 'nm-content';
					type.style.verticalAlign = 'middle';
					type.appendChild(document.createTextNode(searchResults[p].getAttribute('humanType')));
					row.appendChild(type);
					stbody.appendChild(row);
				}
			}
			repaint();
		} else {
			var message = document.createElement('h5');
			message.className = 'nm-content';
			message.style.padding = '1em';
			message.appendChild(document.createTextNode('No element name containing all your search terms were found.'));
			content.appendChild(message);
		}
	}
}

// custom loading dialog
loadingDialog = {
	show : function() {
		var popup = document.getElementById('popup');
		if (!popup) {
			popup = document.createElement('div');
			popup.className = 'nm-content';
			popup.setAttribute('id', 'popup');
			popup.innerHTML = '<span class="nm-content loading">Loading...</span>';
			document.body.appendChild(popup);
		}
	},

	hide : function() {
		var popup = document.getElementById('popup');
		if (popup) {
			document.body.removeChild(popup);
		}
	}
}

function getEvent(e) {
	if (e)
		evt = e;
	else {
		// fixed IE problem. window.event will not send thought different thread. You need to copy them before use it.
		evt = {};
		for ( var i in event) {
			evt[i] = event[i];
		}
	}
	return evt;
}

function getIndexOfArray(myArray, needle) {
	var i, index = -1;

	for (i = 0; i < myArray.length; i++) {
		if (myArray[i] === needle) {
			index = i;
			break;
		}
	}
	return index;
}

function isIE() {
	var isIE = false;
	if (navigator.userAgent.indexOf('MSIE') !== -1 || navigator.appVersion.indexOf('Trident/') > 0) {
		isIE = true;
	}
	return isIE;
}

function isResizableSVG(imageFormat){
	var result = false;
	if (svgdiagramresizable == true && imageFormat == 'svg') {
		result = true;
	}
	return result;
}

function getFileURL(url){
	var is_firefox = /firefox/i.test(navigator.userAgent)
	if (is_firefox && !url.startsWith(contextPath))
	{
		if (url.startsWith("\\\\"))
			url = "file:///" + url;
		else
			url = "file://" + url;
	}
	return url;
}

function showFavorite(evt, content) {

	// show context menu
	var favoritecontextmenu = document.getElementById('favoritecontextmenu');
	if (favoritecontextmenu) {

		//removeAll(favoritecontextmenu);

		var mic = Graphics.mousePosition(evt);
		var mouseX = mic.x + 2;
		var mouseY = mic.y + 2;
		favoritecontextmenu.style.position = 'absolute';
		favoritecontextmenu.style.left = mouseX + 'px';
		favoritecontextmenu.style.top = mouseY + 'px';
		favoritecontextmenu.style.display = 'block';
		favoritecontextmenu.style.visibility = 'visible';
		favoritecontextmenu.style.zIndex = (content.style.zIndex ? content.style.zIndex : 133) + 100;
		content.appendChild(favoritecontextmenu);
		Shadow.castShadow(favoritecontextmenu);
	}
}

function removeContext(evt) {

	var target = evt.target;
	if (target.parentElement.id != "favoritecontextmenu" && target.parentElement.parentElement.id != "favoritecontextmenu") {
		var favoritecontextmenu = document.getElementById('favoritecontextmenu');
		if (favoritecontextmenu) {
			favoritecontextmenu.style.disply = 'none';
			favoritecontextmenu.style.visibility = 'hidden';
			Shadow.removeShadow(favoritecontextmenu);
		}
	}
}

function updateCloseBtn() {
	var closeTab = document.getElementById("closetab_btn");

	closeTab.classList.remove('closetab_over');
	closeTab.classList.remove('closetab_disable');
	closeTab.classList.remove('closetab');

	if (activeTab && activeTab.id != "diagrams_tab" && activeTab.id != "containment_tab") {
		 closeTab.classList.add('closetab');
	 }
	 else {
		 closeTab.classList.add('closetab_disable');
	 }
}

function initFavorite() {
	initCloseTab();

	XMLRequest.send(resourcesLocation + 'xml/' + 'favorites.xml', function(responseXML) {
		var favorites;
		if (responseXML)
			favorites = responseXML.getElementsByTagName('favorites')[0];
		if (favorites != null) {
			var childNodes = favorites.childNodes;

			if (childNodes.length > 0) {

				var favoritecontextmenu = document.createElement('ul');
				favoritecontextmenu.id = 'favoritecontextmenu';
				favoritecontextmenu.className = 'nm-content toolMenu';

				var liitem = document.createElement('li');
				liitem.className = 'nm-content contextheader';
				liitem.appendChild(document.createTextNode("Go To Favorites"));
				favoritecontextmenu.appendChild(liitem);
				liitem.onclick = function(evt) {
					evt.stopPropagation();
				}
				for (var i = 0; i < childNodes.length; i++) {
					liitem = document.createElement('li');
					liitem.className = 'nm-content';

					var qName = childNodes[i].getAttribute("qName");
					if (qName) {
					    var qIndex =  qName.lastIndexOf("::");
					    if (qIndex >= 0) {
					        var parent = qName.substring(0, qIndex);
					        var name = qName.substring(qIndex + 2);
					        liitem.title = name + " [" + parent + "]";
					    }
					    else {
					        liitem.title = qName;
					    }
					}

					var link = document.createElement('a');
					link.href = 'javascript:void(0);';

					var linkIcon = document.createElement('img');
					linkIcon.className = 'nm-content';
					linkIcon.alt = '';
					linkIcon.border = '0';

					var icon = childNodes[i].getAttribute("icon");
					var imageFormat = "";
					if (icon)
						imageFormat = icon.substring(icon.lastIndexOf(".") + 1, icon.length);
					if (isIE() && !isResizableSVG(imageFormat)) {
						// Ignore icon width and height
					}
					else  {
						linkIcon.heigth = '16';
						linkIcon.width = '16';
					}
					linkIcon.style.padding = '2px 5px 2px 5px';
					linkIcon.src = icon;

					var refid = childNodes[i].getAttribute("refid");
					if (refid != null && refid != "") {
						linkIcon.refid = refid;
						link.refid = refid;
						liitem.refid = refid;
						favoriteElements[favoriteElements.length] = refid;
					}

					link.onclick = gotoFavorite;
					linkIcon.onclick = link.onclick;
                    liitem.onclick = link.onclick;

					//link.appendChild(linkIcon);
					var itemName = childNodes[i].getAttribute("name");
					if (!itemName || itemName == null || itemName.lenght == 0)
						itemName = nonamedNode;
					link.appendChild(document.createTextNode(itemName));

					liitem.appendChild(linkIcon);
					liitem.appendChild(link);
					favoritecontextmenu.appendChild(liitem);
				}

				var initTab = document.getElementById('containment_tab');
				favoritecontextmenu.style.disply = 'none';
				favoritecontextmenu.style.visibility = 'hidden';
				Shadow.removeShadow(favoritecontextmenu);
				initTab.append(favoritecontextmenu);
				showFavoriteBtn = true;
			}
			else {
                // TODO when tab tool contain other buttons, remove only favorite button
                 hideFavoriteButton();
            }
		}
		else {
		    hideFavoriteButton();
		}
	}, false, true);
}

function hideFavoriteButton() {
    var fvbtn = document.getElementsByClassName("tool_favorite");
    for (var i = 0; i < fvbtn.length; i++) {
        fvbtn[i].style.display = 'none';
        fvbtn[i].style.visibility = 'hidden';
    }
    showFavoriteBtn = false;
}

function initCloseTab() {
    var closeTab = document.getElementById("closetab_btn");
	if (closeTab) {
		  closeTab.onmouseover = function() {
			 this.classList.remove('closetab_over');
			 this.classList.remove('closetab_disable');
			 this.classList.remove('closetab');

			 if (activeTab && activeTab.id != "diagrams_tab" && activeTab.id != "containment_tab") {
				 this.classList.add('closetab_over');
			 }
			 else {
				 this.classList.add('closetab_disable');
			 }
		  };
		  closeTab.onmouseout = function() {
			  this.classList.remove('closetab_over');
			  this.classList.remove('closetab_disable');
			  this.classList.remove('closetab');

			  if (activeTab && activeTab.id != "diagrams_tab" && activeTab.id != "containment_tab") {
				 this.classList.add('closetab');
			  }
			  else {
				 this.classList.add('closetab_disable');
			  }
		  };
		  closeTab.onmouseup = function() {
			  this.classList.remove('closetab_over');
			  this.classList.remove('closetab_disable');
			  this.classList.remove('closetab');

			  if (activeTab && activeTab.id != "diagrams_tab" && activeTab.id != "containment_tab") {
				 this.classList.add('closetab');
			  }
			  else {
				 this.classList.add('closetab_disable');
			  }
		  };
		  closeTab.onclick = function() {
			  if (activeTab && activeTab.id != "diagrams_tab" && activeTab.id != "containment_tab") {

				  for(var i = 0; i < tabs.length; i++) {
					 var id = tabs[i].id;
					 var tabid =  id + "_tab";
					 if (activeTab.id == tabid) {

						 removeArray(activeTabStack, id);
						 tabs.splice(i, 1);

						 // remove content
						 // remove tree
						 // remove tab
						 var tab = document.getElementById(tabid);
						 tab.parentElement.removeChild(tab);
						 var content = document.getElementById(id + "_content");
						 content.parentElement.removeChild(content);
						 var tool = document.getElementById(id + "_tool");
						 tool.parentElement.removeChild(tool);

						 // show next tab
                         if (tabs.length <= i) // last tab is removed
                            lastActiveTab = tabs[tabs.length - 1];
                         else
                            lastActiveTab = tabs[i];

                         if (lastActiveTab.id == 'diagrams')
                             showDiagramsTab(true);
                         else
                             showContainmentTab(true, lastActiveTab.id);

                         break;
					 }
				  }
			  }
		  }
	}
}

function gotoFavorite(evt) {
	showSpec(this.refid, false, true);
	findNodeForSelected(this.refid, true, false);
	var favoritecontextMenu = document.getElementById('favoritecontextmenu');
	if (favoritecontextMenu) {
		favoritecontextMenu.style.disply = 'none';
		favoritecontextMenu.style.visibility = 'hidden';
		Shadow.removeShadow(favoritecontextMenu);
	}
	evt.stopPropagation();
}

function openNewTree(evt) {
	if (selectedNode) {
		var isCustomModel = Boolean(selectedNode.mr_isCustomModel);
		if (!isCustomModel) {

			var nodeId = selectedNode.getAttribute("refid");
			var tobeOpenTab = document.getElementById(nodeId + "_tab");
			if (typeof tobeOpenTab == 'undefined' || tobeOpenTab == null) {

				var selectedAnchor = selectedNode.querySelector("a[name=anchorNode]");
				var textContent = selectedAnchor.textContent;

				if (textContent == null || textContent.length == 0)
					textContent = nonamedNode;

				//create tab
				var newTab = document.createElement("li");
				newTab.id=nodeId + "_tab";
				newTab.tabid=tabNumber;

				var newTabid="" + tabNumber;
				var newTabIndex="" + tabs.length;
				var newTreeId=nodeId + '_tree';
				var newT = {id: nodeId, treeId: newTreeId, tabIndex: newTabIndex, tabid: newTabid};
				tabs.push(newT);

				tabNumber = tabNumber + 1;

				newTab.className="nm-content";
				newTab.setAttribute("onclick", "showContainmentTab(true, '" + nodeId + "')");
				newTab.title=textContent;

				var span = document.createElement("span");
				span.title=textContent;
				span.appendChild(document.createTextNode(textContent));
				newTab.appendChild(span);

				//var lastChild = document.getElementById("expand_icon");
				//lastChild.parentNode.insertBefore(newTab, lastChild);
				var parent = document.getElementById("topTab");
				parent.appendChild(newTab);

				var tool = document.createElement("div");
				tool.id=nodeId + "_tool";
				tool.className="nm-content tab_tool";

				var tool_btn_ca = document.createElement("div");
				tool_btn_ca.className="tool_button tool_collapse_all tool_collapse_all_active";
				tool_btn_ca.title="Collapse All";
				tool_btn_ca.onclick=function(evt) {
						collapseAll(evt, this);
				};
				tool.appendChild(tool_btn_ca);

				var tool_btn_cr = document.createElement("div");
				tool_btn_cr.className="tool_button tool_collapse_recursive tool_collapse_recursive_active";
				tool_btn_cr.title="Collapse Selected Recursively";
				tool_btn_cr.onclick=collapseRecursively;
				tool.appendChild(tool_btn_cr);


				var tool_btn_nt = document.createElement("div");
				tool_btn_nt.className="tool_button tool_newtree tool_newtree_active";
				tool_btn_nt.title="Open in New Tree";
				tool_btn_nt.onclick=openNewTree;
				tool.appendChild(tool_btn_nt);

				if (showFavoriteBtn) {
					var tool_btn_fv = document.createElement("div");
					tool_btn_fv.className="tool_button tool_favorite";
					tool_btn_fv.title="Favorites";
					tool_btn_fv.onclick=function(evt) {
						showFavorite(evt, this);
					};
					tool.appendChild(tool_btn_fv);
				}

				var tabAndContent = document.getElementById("tabAndContent");
				tabAndContent.appendChild(tool);

				var newContent = document.createElement("div");
				newContent.id=nodeId + "_content";
				newContent.contentid = newTab.tabid;
				newContent.className="nm-content tabInner tree_content";
				newContent.style="flex-grow : 1;"

				tabAndContent.appendChild(newContent);

				var iconSrc;
				var icons = selectedNode.querySelectorAll(":scope > a > img");
				if (icons)
					iconSrc = icons[icons.length - 1].getAttribute("src");

				XMLRequest.send(resourcesLocation + 'xml/tree/' + nodeId +'.xml', function(responseXML) {
					if (responseXML) {
						showLoading();
						var root = document.createElement('ul');
						root.className = 'nm-content tree';
						root.id = newTreeId;
						root.rootElement = nodeId;

						var nTree = new Tree(root.id);
						nTree.image.plus = resourcesLocation + 'images/tree/plus.gif';
						nTree.image.minus = resourcesLocation + 'images/tree/minus.gif';
						nTree.root = root;
						var dataModel = firstChild(responseXML);

						var browser = document.getElementById(nodeId + '_content');
						var contentid = browser.contentid;

						var nodeName = dataModel.getAttribute('name');
						if (nodeName == null || nodeName.length == 0)
							nodeName = nonamedNode;

						var node = addChildNode(root, nodeName, dataModel, iconSrc);
						node.data = dataModel;
						node.setAttribute('refid', dataModel.getAttribute('refid'));
						buildTree(node, contentid);

						browser.appendChild(root);
						newTab.title=dataModel.getAttribute('name');

						nTree.expand(node);

						var ulNode = node.querySelector("ul");
						if(ulNode)
							node.isExpanded = true;

						newT["tree"] = nTree;

						var anchorN = node.querySelector("a[name=anchorNode]");
						setHighlightNode(anchorN, node);

						newT["selectedNode"] = node;

						hideLoading();
					}
				}, false, true);
			}

			showContainmentTab(true, nodeId);
		}
	}
}

function collapseRecursively() {
	if (selectedNode && (selectedNode.isExpanded || selectedNode.parentNode.isExpanded)) {

		var selectedTab = null;
		for (var i = 0; i < tabs.length; i++) {
			var tabid = tabs[i].id + "_tab";
			if (tabid == activeTab.id) {
				selectedTab = tabs[i];
				break;
			}
		}
		selectedTab.tree.collapseAll(selectedNode);
	}
}

function collapseAll(evt, collapseAllBtn) {
	if (!collapseAllBtn.classList.contains("tool_collapse_all_inactive")) {
		var tabId = "containment_tab"
		if (activeTab)
			tabId = activeTab.id;

		for (var i = 0; i < tabs.length; i++) {
			var id = tabs[i].id;
			var currentTabId = id + "_tab";
			var treeId = tabs[i].treeId; // ul /tree, dtree, elementid_tree
			var toolId = id + "_tool";

			if (tabId == currentTabId) {
				skipUpdateCollapseBtn = true;
				var root = document.getElementById(treeId);
				var lis = root.querySelectorAll(":scope > li");

				var firstNode = null;
				for (var k = 0; k < lis.length; k++) {
					if (k > 0) {
						tabs[i].tree.collapseAll(lis[k]);
					}
					else {
						firstNode = lis[k];
						var childs = lis[k].querySelectorAll(":scope > ul > li");
						for (var j = 0; j < childs.length; j++) {
							var ulNode = childs[j].querySelector(":scope > ul")
							if (childs[j].isExpanded || (ulNode && ulNode.isExpanded)) {
								tabs[i].tree.collapseAll(childs[j]);
							}
						}
					}
				}

				// remove selected
				var node = tabs[i].selectedNode;
				if (node && node.tagName == 'LI') {
					var childNodes = node.childNodes;
					for ( var n = 0; n < childNodes.length; n++) {
						if (childNodes[n].name == 'anchorNode') {
							childNodes[n].style.backgroundColor = '';
							break;
						}
					}
				}
				else if (node && node.tagName == 'A') {
					if (node.name == 'anchorNode') {
						node.style.backgroundColor = '';
					}
				}

				// clear selectedNode
				if (tabs[i].id == "diagrams") {
					var childNodes = firstNode.childNodes;
					for ( var n = 0; n < childNodes.length; n++) {
						if (childNodes[n].name == 'anchorNode') {
							childNodes[n].style.backgroundColor = '#99CCFF';
							break;
						}
					}

					tabs[i].selectedNode = firstNode;
					selectedNode = firstNode;
				}
				else {
					tabs[i].selectedNode = null;
					selectedNode = null;

					// TODO clear document tab, property tab,
				}
				clearDocumentationTab();
                clearPropertiesTab();

				var toolb = document.getElementById(toolId);
				var newTreeBtn = toolb.querySelector(".tool_newtree");
				if (newTreeBtn) {
					newTreeBtn.classList.remove("tool_newtree_inactive");
					newTreeBtn.classList.remove("tool_newtree_active");
					newTreeBtn.classList.add("tool_newtree_inactive");
				}

				var collapseAllBtn = toolb.querySelector(".tool_collapse_all");
				if (collapseAllBtn) {
					collapseAllBtn.classList.remove("tool_collapse_all_inactive");
					collapseAllBtn.classList.remove("tool_collapse_all_active");
					collapseAllBtn.classList.add("tool_collapse_all_inactive");
				}

				var collapseReBtn = toolb.querySelector(".tool_collapse_recursive");
				if (collapseReBtn) {
					collapseReBtn.classList.remove("tool_collapse_recursive_inactive");
					collapseReBtn.classList.remove("tool_collapse_recursive_active");
					collapseReBtn.classList.add("tool_collapse_recursive_inactive");
				}

				skipUpdateCollapseBtn = false;
				break;
			}
		}
	}
}

function getChildNodes(m) {
	if (m.getAttribute('requireSort') == "node")
	{
		var childNodes = [];
		var childNodesOriginal = m.childNodes;
		for (var s = 0; s < childNodesOriginal.length; s++) {
			childNodes.push(childNodesOriginal[s]);
		}
		childNodes = childNodes.sort(function(o1, o2) {
			if (o1 === null) {
				return o2 === null ? 0 : 1;
			}
			else if (o2 === null) {
				return -1;
			}
			var name1 = o1.getAttribute("humanName");
			var name2 = o2.getAttribute("humanName");
			var n1 = name1 === null || name1.length == 0 ? o1.nodeName : name1;
			var n2 = name2 === null || name2.length == 0 ? o2.nodeName : name2;
			if (n1 === null) {
				return n2 === null ? 0 : 1;
			}
			else if (n2 === null) {
				return -1;
			}
			return n1.localeCompare(n2, undefined, { sensitivity: 'base' });
		});
	}
	else if (m.getAttribute('requireSort') == "name")
	{
		var childNodes = [];
		var childNodesOriginal = m.childNodes;
		for (var s = 0; s < childNodesOriginal.length; s++) {
			childNodes.push(childNodesOriginal[s]);
		}
		childNodes = childNodes.sort(function(o1, o2) {
			if (o1 === null) {
				return o2 === null ? 0 : 1;
			}
			else if (o2 === null) {
				return -1;
			}
			var name1 = o1.getAttribute("name");
			var name2 = o2.getAttribute("name");
			var order1 = 0;
			if (name1 === null) {
				order1 = name2 === null ? 0 : 1;
			}
			else if (name2 === null) {
				order1 = -1;
			}
			else {
				order1 = name1.localeCompare(name2, undefined, { sensitivity: 'base' });
			}
			if (order1 ===  0) {
				name1 = o1.textContent;
				name2 = o2.textContent;
				if (name1 === null) {
					return name2 === null ? 0 : 1;
				}
				else if (name2 === null) {
					return -1;
				}
				return  name1.localeCompare(name2, undefined, { sensitivity: 'base' });
			}
			return order1;
		});
	}
	else if (m.getAttribute('requireSort') == "element")
	{
		var childNodes = [];
		var childNodesOriginal = m.childNodes;
		for (var s = 0; s < childNodesOriginal.length; s++) {
			childNodes.push(childNodesOriginal[s]);
		}
		childNodes = childNodes.sort(function(o1, o2) {
			if (o1 === null) {
				return o2 === null ? 0 : 1;
			}
			else if (o2 === null) {
				return -1;
			}
			var name1 = o1.getAttribute("name");
			var name2 = o2.getAttribute("name");
			var order1 = 0;
			if (name1 === null) {
				order1 = name2 === null ? 0 : 1;
			}
			else if (name2 === null) {
				order1 = -1;
			}
			else {
				order1 = name1.localeCompare(name2, undefined, { sensitivity: 'base' });
			}
			return order1;
		});
	}
	else {
		var childNodes = m.childNodes;
	}
	return childNodes;
}