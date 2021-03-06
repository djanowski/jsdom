var core                     = require("../level1/core").dom.level1.core,
    INVALID_STATE_ERR        = core.INVALID_STATE_ERR        = 11,
    SYNTAX_ERR               = core.SYNTAX_ERR               = 12,
    INVALID_MODIFICATION_ERR = core.INVALID_MODIFICATION_ERR = 13,
    NAMESPACE_ERR            = core.NAMESPACE_ERR            = 14,
    INVALID_ACCESS_ERR       = core.INVALID_ACCESS_ERR       = 15,
    ns = {
      validate : function(ns, URI) {
        if (!ns) {
          throw new core.DOMException(core.INVALID_CHARACTER_ERR, "namespace is undefined");
        }

        if(ns.match(/[^0-9a-z\.:\-_]/i) !== null) {
          throw new core.DOMException(core.INVALID_CHARACTER_ERR, ns);
        }

        var msg = false, parts = ns.split(':');
        if (ns === 'xmlns'                          &&
            URI !== "http://www.w3.org/2000/xmlns/")
        {
          msg = "localName is 'xmlns' but the namespaceURI is invalid";

        } else if (ns === "xml"                                   &&
                   URI !== "http://www.w3.org/XML/1998/namespace")
        {
          msg = "localName is 'xml' but the namespaceURI is invalid";

        } else if (ns[ns.length-1] === ':') {
          msg = "Namespace seperator found with no localName";

        } else if (ns[0] === ':') {
          msg = "Namespace seperator found, without a prefix";

        } else if (parts.length > 2) {
          msg = "Too many namespace seperators";

        }

        if (msg) {
          throw new core.DOMException(NAMESPACE_ERR, msg + " (" + ns + "@" + URI + ")");
        }
      }
    };


core.exceptionMessages['NAMESPACE_ERR'] = "Invalid namespace";

core.DOMImplementation.prototype.createDocumentType = function(/* String */ qualifiedName,
                                                               /* String */ publicId,
                                                               /* String */ systemId)
{
  ns.validate(qualifiedName);
  var doctype = new core.DocumentType(null, qualifiedName);
  doctype._publicId = publicId ? publicId : '';
  doctype._systemId = systemId ? systemId : '';
  return doctype;
};

/**
  Creates an XML Document object of the specified type with its document element.
  HTML-only DOM implementations do not need to implement this method.
*/
core.DOMImplementation.prototype.createDocument = function(/* String */       namespaceURI,
                                                           /* String */       qualifiedName,
                                                           /* DocumentType */ doctype)
{
  ns.validate(qualifiedName, namespaceURI);

  if (doctype && doctype.ownerDocuemnt !== null) {
    throw new core.DOMException(core.WRONG_DOCUMENT_ERR);
  }

  if (qualifiedName.indexOf(':') > -1 && !namespaceURI) {
    throw new core.DOMException(NAMESPACE_ERR);
  }

  var document = new core.Document();
  document.namespaceURI = namespaceURI;
  document.qualifiedName = qualifiedName;
  document.doctype = doctype;
  document._ownerDocument = document;
  return document;
};

core.Node.prototype.__defineGetter__("ownerDocument", function() {
  return this._ownerDocument || null;
});

core.Node.prototype.isSupported = function(/* string */ feature,
                                           /* string */ version)
{
  return this._ownerDocument.implementation.hasFeature(feature, version);
};

core.Node.prototype._namespaceURI = null;
core.Node.prototype.__defineGetter__("namespaceURI", function() {
  return this._namespaceURI || null;
});

core.Node.prototype.__defineSetter__("namespaceURI", function(value) {
  this._namespaceURI = value;
});

core.Node.prototype.__defineGetter__("prefix", function() {
  return this._prefix || null;
});

core.Node.prototype.__defineSetter__("prefix", function(value) {
  if (this._prefix === "xmlns") {
    throw new core.DOMException(core.NAMESPACE_ERR);
  }

  if (this.readonly) {
    throw new core.DOMException(core.NO_MODIFICATION_ALLOWED_ERR);
  }

  ns.validate(value, this._namespaceURI);

  this._prefix = value;
});

core.Node.prototype.__defineGetter__("localName", function() {
  return this._localName || null;
});

/* return boolean */
core.Node.prototype.hasAttributes = function() {
  return (this._attributes && this._attributes.length > 0);
};

core.NamedNodeMap.prototype.getNamedItemNS = function(/* string */ namespaceURI,
                                                      /* string */ localName)
{
  return this._map(function(item) {
    var node = null, equal = item.localName === localName;
    if (item.ownerDocument &&
        item.ownerDocument.doctype &&
        item.ownerDocument.doctype.attributes)
    {
      node = this._ownerDocument.doctype._attributes.getNamedItem(localName);
    }


    if (namespaceURI === item.namespaceURI || !namespaceURI) {
      return (equal || node) ? true : false;
    }
    return false;
  })[0] || null;
};

core.AttrNodeMap.prototype.setNamedItem = function(/* Node */ arg) {
  if (arg.nodeType !== this._ownerDocument.ATTRIBUTE_NODE) {
    throw new core.DOMException(core.HIERARCHY_REQUEST_ERR);
  }

  return core.NamedNodeMap.prototype.setNamedItem.call(this, arg);
};

core.NamedNodeMap.prototype.setNamedItemNS = function(/* Node */ arg)
{
  var owner = this._ownerDocument;
  if (this._parentNode &&
      this._parentNode._parentNode &&
      this._parentNode._parentNode.nodeType === owner.ENTITY_NODE)
  {
    throw new core.DOMException(core.NO_MODIFICATION_ALLOWED_ERR);
  }

  if (arg.nodeType !== owner.ATTRIBUTE_NODE) {
    throw new core.DOMException(core.HIERARCHY_REQUEST_ERR);
  }

  if (arg._parentNode) {
    throw new core.DOMException(core.INUSE_ATTRIBUTE_ERR);
  }
  return this.setNamedItem(arg);
};

core.NamedNodeMap.prototype.removeNamedItemNS = function(/*string */ namespaceURI,
                                                         /* string */ localName)
{
  if (this._parentNode &&
      this._parentNode._parentNode &&
      this._parentNode._parentNode.nodeType === this._ownerDocument.ENTITY_NODE)
  {
    throw new core.DOMException(core.NO_MODIFICATION_ALLOWED_ERR);
  }

  var fullName = false, i=0, l=this.length, item;
  for (i; i<l; i++) {
    item = this.item(i);
    if (item.localName === localName) {
      fullName = item.nodeName;
      break;
    }
  }

  if (!fullName) {
    throw new core.DOMException(core.NOT_FOUND_ERR);
  }

  return this.removeNamedItem(fullName);
};

core.Attr.prototype.__defineGetter__("ownerElement", function() {
  return this._ownerElement || null;
});

core.Node.prototype.__defineSetter__("qualifiedName", function(qualifiedName) {
  ns.validate(qualifiedName, this._namespaceURI);
  qualifiedName       = qualifiedName || "";
  this._localName     = qualifiedName.split(":")[1] || null;
  this.prefix        = qualifiedName.split(":")[0] || null;
  this._qualifiedName = qualifiedName;
});

core.NamedNodeMap.prototype._map = function(fn) {
  var ret = [], l = this.length, i = 0, node;
  for(i; i<l; i++) {
    node = this.item(i);
    if (fn && fn(node)) {
      ret.push(node);
    }
  }
  return ret;
};

core.Element.prototype.getAttributeNS = function(/* string */ namespaceURI,
                                                 /* string */ localName)
{
  var attr = this._attributes._map(function(attr) {
    if (namespaceURI === attr.namespaceURI &&
        attr.localName === localName)
    {
      return true;
    }
  })[0];

  return (attr) ? attr.nodeValue : null;
};

core.Element.prototype.setAttributeNS = function(/* string */ namespaceURI,
                                                 /* string */ qualifiedName,
                                                 /* string */ value)
{
  var s       = qualifiedName.split(':'),
      local   = s.pop(),
      prefix  = s.pop() || null;

  ns.validate(qualifiedName, namespaceURI);

  if (qualifiedName.split(':').shift() === "xml" &&
      namespaceURI !== "http://www.w3.org/XML/1998/namespace")
  {
    throw new core.DOMException(core.NAMESPACE_ERR);
  }

  var found = this._attributes._map(function(attr) {
    if (namespaceURI === attr.namespaceURI &&
        attr.localName === local)
    {
      return true;
    }
  });

  if (!found || !found[0]) {
    attr = this.setAttribute(qualifiedName, value);
    if (attr) {
      attr.namespaceURI = namespaceURI;
      attr._localName = local;
      attr._prefix    = prefix;
    }
  } else {
    attr = found[0];
    attr.qualifiedName = qualifiedName;
    attr.value = value;
  }

  return attr;
};

core.Element.prototype.removeAttributeNS = function(/* string */ namespaceURI,
                                                    /* string */ localName)
{

  if (this.readonly) {
    throw new core.DOMException(core.NO_MODIFICATION_ALLOWED_ERR);
  }


  var defaults = this.ownerDocument.doctype._attributes, clone,
      found = this._attributes._map(function(attr) {
        if (namespaceURI === attr.namespaceURI &&
            attr.localName === localName)
        {
          return true;
        }
      }),
      defaultEl = defaults.getNamedItem(this.name),
      defaultAttr;


  if (!found || !found[0]) {
    return;
  } else if (defaultEl) {
    found = found[0]
    defaultAttr = defaultEl.getAttributeNode(found.name);
  }

  this.removeAttribute(found);
  if (defaultAttr) {
    clone = defaultAttr.cloneNode(true);
    clone.namespaceURI = found.namespaceURI;
    clone.qualifiedName = found.name;
    this.setAttributeNodeNS(clone);
  }

  return found;
};

core.Element.prototype.getAttributeNodeNS = function(/* string */ namespaceURI,
                                                     /* string */ localName)
{
  return this._attributes._map(function(attr) {
    if (namespaceURI === attr.namespaceURI &&
        attr.localName === localName)
    {
      return true;
    }
  })[0] || null;
};

core.Element.prototype.setAttributeNodeNS = function(/* Attr */ newAttr)
{
  if (newAttr.ownerElement) {
    throw new core.DOMException(core.INUSE_ATTRIBUTE_ERR);
  }

  var existing = this.getAttributeNodeNS(newAttr.namespaceURI,
                                         newAttr.localName);
  if (existing) {
    this.removeAttribute(existing.qualifiedName);
  }

  newAttr._ownerElement = this;
  this.setAttributeNode(newAttr);
  return existing;
};

core.Element.prototype.getElementsByTagNameNS = function(/* String */ namespaceURI,
                                                         /* String */ localName)
{
  var nsPrefixCache = {};

  function filterByTagName(child) {
    if (child.nodeType && child.nodeType === this.ENTITY_REFERENCE_NODE) {
      child = child._entity;
    }

    var localMatch = child.localName === localName,
        nsMatch    = child.namespaceURI === namespaceURI;
    if ((localMatch || localName === "*") &&
        (nsMatch || namespaceURI === "*"))
    {
      return true;
    }
    return false;
  }

  return new core.NodeList(this.ownerDocument || this,
                           core.mapper(this, filterByTagName));
};

core.Element.prototype.hasAttribute = function(/* string */name)
{
  if (!this.attributes) {
    return false;
  }
  return this.attributes.exists(name);
};

core.Element.prototype.hasAttributeNS = function(/* string */namespaceURI,
                                                 /* string */localName)
{
  if (!this._attributes        ||
      !this._attributes.length ||
      this._attributes.length < 1)
  {
    return false;
  }
  return this.hasAttribute(localName);
};

core.DocumentType.prototype.__defineGetter__("publicId", function() {
  return this._publicId || "";
});

core.DocumentType.prototype.__defineGetter__("systemId", function() {
  return this._systemId || "";
});

core.DocumentType.prototype.__defineGetter__("internalSubset", function() {
  return this._internalSubset || null;
});

core.Document.prototype.importNode = function(/* Node */ importedNode,
                                              /* bool */ deep)
{
  if (importedNode && importedNode.nodeType) {
    if (importedNode.nodeType === this.DOCUMENT_NODE ||
        importedNode.nodeType === this.DOCUMENT_TYPE_NODE) {
      throw new core.DOMException(core.NOT_SUPPORTED_ERR);
    }
  }

  var self = this,
      newNode = importedNode.cloneNode(deep);

  function setOwnerDocument(el) {
    el._ownerDocument = self;
    if (el.id) {
      self._ids[el.id] = el;
    }
    if (el.attributes) {
      el.attributes._ownerDocument = self;
      for (var i=0,len=el.attributes.length; i < len; i++) {
        el.attributes.item(i)._ownerDocument = self;
      }
    }
  }
  if (deep) {
    core.visitTree(newNode, setOwnerDocument);
  }
  else {
    setOwnerDocument(newNode);
  }

  if (importedNode.namespaceURI) {
    newNode.namespaceURI = importedNode.namespaceURI;
  }

  if (importedNode.qualifiedName) {
    newnode.qualifiedName = importedNode.qualifiedName;
  }


  return newNode;
};

core.Document.prototype.createElementNS = function(/* string */ namespaceURI,
                                                   /* string */ qualifiedName)
{
  var parts   = qualifiedName.split(':'),
      element;

  if (parts.length > 1 && !namespaceURI) {
    throw new core.DOMException(core.NAMESPACE_ERR);
  }

  ns.validate(qualifiedName, namespaceURI);
  element = this.createElement(qualifiedName),

  element._namespaceURI = namespaceURI;
  element._qualifiedName = qualifiedName;

  element._localName = parts.pop();

  if (parts.length > 0) {
    element.prefix = parts.pop();
  }

  return element;
};

core.Document.prototype.createAttributeNS = function(/* string */ namespaceURI,
                                                     /* string */ qualifiedName)
{
  var attribute, parts = qualifiedName.split(':');

  if (parts.length > 1 && !namespaceURI) {
    throw new core.DOMException(core.NAMESPACE_ERR,
                                "Prefix specified without namespaceURI (" + qualifiedName + ")");
  }


  ns.validate(qualifiedName, namespaceURI);

  attribute = this.createAttribute(qualifiedName);
  attribute.namespaceURI = namespaceURI;
  attribute.qualifiedName = qualifiedName;

  attribute._localName = parts.pop();
  attribute._prefix = (parts.length > 0) ? parts.pop() : null;
  return attribute;
};

core.Document.prototype.getElementsByTagNameNS = function(/* String */ namespaceURI,
                                                          /* String */ localName)
{
  var nsPrefixCache = {};

  function filterByTagName(child) {
    if (child.nodeType && child.nodeType === this.ENTITY_REFERENCE_NODE) {
      child = child._entity;
    }

    var localMatch = child.localName === localName,
        nsMatch    = child.namespaceURI === namespaceURI;
    if (child.nodeType === child.ELEMENT_NODE &&
        (localMatch || localName === "*") &&
        (nsMatch || namespaceURI === "*"))
    {
      return true;
    }
    return false;
  }

  return new core.NodeList(this.ownerDocument || this,
                           core.mapper(this, filterByTagName));
};

core.Element.prototype.__defineSetter__("id", function(id) {
  this.setAttribute("id", id);
  id = this.getAttribute("id"); //Passed validation
  if (!this._ownerDocument._ids) {
      this._ownerDocument._ids = {};
  }
  if (id === '') {
      delete this._ownerDocument._ids[id];
  } else {
      this._ownerDocument._ids[id] = this;
  }
});

core.Element.prototype.__defineGetter__("id",function() {
  return this.getAttribute("id");
});

core.Document.prototype.getElementById = function(id) {
  return this._ids[id] || null;
};


exports.dom =
{
  level2 : {
    core : core
  }
};
