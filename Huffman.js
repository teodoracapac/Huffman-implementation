// Sample of how the compression tree should look like.
// A0 is the father (the root of the tree)
// each level introduce a byte in the final code 
// each node could have maximum 2 children (L - left (introduce a "0") and 
// R - right (introduce a "1"))
// the node name should contain the name of previous visited nodes.
// ex.: A0LR - Level 2, code: 01


// Function to create Huffman coding tree from input string
function createHuffmanTree(str) {
  if (!str) return null;
  
  // Count frequency of each character
  const freqMap = {};
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    freqMap[char] = (freqMap[char] || 0) + 1;
  }
  
  // Create leaf nodes for each character
  const nodes = Object.keys(freqMap).map(char => ({
    name: char === ' ' ? "spatiu" : char,
    value: freqMap[char],
    char: char,
    children: null
  }));
  
  // Build the tree
  while (nodes.length > 1) {
    // Sort nodes by frequency (ascending)
    nodes.sort((a, b) => a.value - b.value);
    
    // Take the two nodes with lowest frequencies
    const left = nodes.shift();
    const right = nodes.shift();
    
    // Create a new internal node with these two as children
    const newNode = {
      name: `${left.value + right.value}`,
      value: left.value + right.value,
      children: [left, right]
    };
    
    // Add the new node back into the queue
    nodes.push(newNode);
  }
  
  // Return the root node (Huffman tree)
  return nodes[0] || null;
}

// Function to generate Huffman codes from the tree
function generateCodes(node, prefix = '', codes = {}) {
  if (!node) return codes;
  
  // If this is a leaf node (has a character)
  if (node.char) {
    codes[node.char] = prefix;
    return codes;
  }
  
  // Traverse left (add '0' to code)
  if (node.children && node.children[0]) {
    generateCodes(node.children[0], prefix + '0', codes);
  }
  
  // Traverse right (add '1' to code)
  if (node.children && node.children[1]) {
    generateCodes(node.children[1], prefix + '1', codes);
  }
  
  return codes;
}

// Format tree data for visualization
function formatTreeForD3(node, level = 0) {
  if (!node) return null;
  
  let formatted = {};
  
  if (node.char) {
    // Leaf node with character
    formatted.name = `Level ${level}: ${node.name}`;
  } else {
    // Internal node with value
    formatted.name = `Level ${level}: ${node.name}`;
  }
  
  if (node.children) {
    formatted.children = [];
    for (let i = 0; i < node.children.length; i++) {
      const child = formatTreeForD3(node.children[i], level + 1);
      if (child) {
        formatted.children.push(child);
      }
    }
  }
  
  return formatted;
}


var treeData = {
  "name": "Level 0"
};
var margin = {top: 20, right: 90, bottom: 30, left: 90},
    width = 3060 - margin.left - margin.right,
    height = 1000 - margin.top - margin.bottom;

	
// append the svg object to the body of the page
// appends a 'group' element to 'svg'
// moves the 'group' element to the top left margin
var svg = d3.select("body").append("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate("
          + margin.left + "," + margin.top + ")");

var i = 0,
    duration = 750,
    root;

// declares a tree layout and with a given size
var treemap = d3.tree().size([height, width]);

// Initialize with default data
initTree(treeData);

// Function to initialize the tree with data
function initTree(data) {
  // Clear existing content
  svg.selectAll("*").remove();
  i = 0;
  
  // Assigns parent, children, height, depth
  root = d3.hierarchy(data, function(d) { return d.children; });
  root.x0 = height / 2;
  root.y0 = 0;

  // Collapse after the second level if there are children
  if (root.children) {
    root.children.forEach(collapse);
  }

  update(root);
}

// Collapse the node and all it's children
function collapse(d) {
  if(d.children) {
    d._children = d.children
    d._children.forEach(collapse)
    d.children = null
  }
}

function update(source) {

  // Assigns the x and y position for the nodes
  var treeData = treemap(root);

  // Compute the new tree layout.
  var nodes = treeData.descendants(),
      links = treeData.descendants().slice(1);

  // Normalize for fixed-depth.
  nodes.forEach(function(d){ d.y = d.depth * 180});

  // updating the nodes

  var node = svg.selectAll('g.node')
      .data(nodes, function(d) {return d.id || (d.id = ++i); });

  // Enter any new nodes at the parent's previous position if necessary
  var nodeEnter = node.enter().append('g')
      .attr('class', 'node')
      .attr("transform", function(d) {
        return "translate(" + source.y0 + "," + source.x0 + ")";
    })
    .on('click', click);

  // Add a circle for the nodes
  nodeEnter.append('circle')
      .attr('class', 'node')
      .attr('r', 1e-6)
      .style("fill", function(d) {
          return d._children ? "lightsteelblue" : "#fff";
      });

  // labels for the nodes
  nodeEnter.append('text')
      .attr("dy", ".35em")
      .attr("x", function(d) {
          return d.children || d._children ? -13 : 13;
      })
      .attr("text-anchor", function(d) {
          return d.children || d._children ? "end" : "start";
      })
      .text(function(d) { return d.data.name; });

  // UPDATE
  var nodeUpdate = nodeEnter.merge(node);

  // Transition to the proper position for the node
  nodeUpdate.transition()
    .duration(duration)
    .attr("transform", function(d) { 
        return "translate(" + d.y + "," + d.x + ")";
     });

  // Update the node attributes and style
  nodeUpdate.select('circle.node')
    .attr('r', 10)
    .style("fill", function(d) {
        return d._children ? "lightsteelblue" : "#fff";
    })
    .attr('cursor', 'pointer');


  // Remove any exiting nodes
  var nodeExit = node.exit().transition()
      .duration(duration)
      .attr("transform", function(d) {
          return "translate(" + source.y + "," + source.x + ")";
      })
      .remove();

  // On exit reduce the node circles size to 0
  nodeExit.select('circle')
    .attr('r', 1e-6);

  // On exit reduce the opacity of text labels
  nodeExit.select('text')
    .style('fill-opacity', 1e-6);

  // updating the links
  var link = svg.selectAll('path.link')
      .data(links, function(d) { return d.id; });

  // Enter any new links at the parent's previous position.
  var linkEnter = link.enter().insert('path', "g")
      .attr("class", "link")
      .attr('d', function(d){
        var o = {x: source.x0, y: source.y0}
        return diagonal(o, o)
      });

  // UPDATE
  var linkUpdate = linkEnter.merge(link);

  // Transition back to the parent element position
  linkUpdate.transition()
      .duration(duration)
      .attr('d', function(d){ return diagonal(d, d.parent) });

  // Remove any exiting links
  var linkExit = link.exit().transition()
      .duration(duration)
      .attr('d', function(d) {
        var o = {x: source.x, y: source.y}
        return diagonal(o, o)
      })
      .remove();

  // Store the old positions for transition.
  nodes.forEach(function(d){
    d.x0 = d.x;
    d.y0 = d.y;
  });

  // Creates a curved (diagonal) path from parent to the child nodes
  function diagonal(s, d) {

    path = `M ${s.y} ${s.x}
            C ${(s.y + d.y) / 2} ${s.x},
              ${(s.y + d.y) / 2} ${d.x},
              ${d.y} ${d.x}`

    return path
  }

  // Toggle children on click.
  function click(d) {
    if (d.children) {
        d._children = d.children;
        d.children = null;
      } else {
        d.children = d._children;
        d._children = null;
      }
    update(d);
  }
}

// Add event listener to the input box
document.addEventListener('DOMContentLoaded', function() {
  const inputField = document.querySelector('.message');
  const codesElement = document.querySelector('.output-empty:last-child');
  
  if (inputField) {
    inputField.addEventListener('input', function() {
      const inputText = this.value;
      
      if (!inputText || inputText.trim() === '') {
        // Use default tree if input is empty
        initTree(treeData);
        codesElement.className = 'output-empty';
        codesElement.textContent = 'Coduri noi:';
        return;
      }
      
      // Create Huffman tree from input
      const huffmanTree = createHuffmanTree(inputText);
      if (huffmanTree) {
        // Format tree for D3
        const formattedTree = formatTreeForD3(huffmanTree);
        
        // Update the tree
        initTree(formattedTree);
        
        // Generate codes and display them
        const codes = generateCodes(huffmanTree);
        
        // Display codes
        codesElement.className = 'output';
        let codesHTML = 'Coduri noi:<br>';
        for (const char in codes) {
          codesHTML += `"${char === ' ' ? 'spatiu' : char}": ${codes[char]}<br>`;
        }
        codesElement.innerHTML = codesHTML;
      }
    });
  }
});