---
cssclasses:
  - full-width-edit
  - full-width-preview
---
## ✏️ Notes


___
```dataviewjs
const version = "2.3.5";
const teamName = "Nueral";
const overrideTeamMemberName = false;

// TASKS ----------------------------------------------------------------------------------------------------
const fullName = overrideTeamMemberName || dv.current().file.name;
const teamMemberName = fullName.toLowerCase().split(" ").join("-");

// Map to store tasks with unique identifiers
const taskMap = new Map();

// Get pages and tasks
let folderPages;
if (teamName) {
    const pathRegex = new RegExp(`^(.*?${teamName})(?:\\/|$)`);
    const match = dv.current().file.path.match(pathRegex);
    const folderPath = match ? match[1] : null;
    folderPages = folderPath ? dv.pages(`"${folderPath}"`) : dv.pages();
} else {
    folderPages = dv.pages();
}

// Process tasks and assign unique IDs
let currentTasks = [];
folderPages.forEach(page => {
    const tasks = page.file.tasks ? page.file.tasks.values : [];
    tasks.forEach(task => {
        const uniqueId = `${page.file.path}:${task.line}`;
        const enhancedTask = {
            ...task,
            _uniqueId: uniqueId,
            _filePath: page.file.path,
            _fileName: page.file.name,
            _parentId: task.parent ? `${page.file.path}:${task.parent}` : null
        };
        taskMap.set(uniqueId, enhancedTask);
        currentTasks.push(enhancedTask);
    });
});

// UTILS ----------------------------------------------------------------------------------------------------
const isMarkedCompleted   = task => /✅\s\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])/.test(task.text);
const isCancelled         = task => /❌/.test(task.text);
const activeForMember = (task, status = true) => {
  const pattern = status
    ? `^(?!.*inactive-${teamMemberName}(?![\\w-])).*active-${teamMemberName}(?![\\w-])`
    : `inactive-${teamMemberName}(?![\\w-])`;
  const re = new RegExp(pattern, "i");
  return re.test(task.text) && !isCancelled(task);
};
const isAssignedToAnyUser = task => task && /active-[\w-]+/.test(task.text);
const isRelevantToday     = task => {
    const today = new Date(); today.setHours(0,0,0,0);
    const start     = task.start     ? new Date(task.start)     : null;
    const due       = task.due       ? new Date(task.due)       : null;
    const scheduled = task.scheduled ? new Date(task.scheduled) : null;
    if (task.completed || task.status === "-") return false;
    return (!start && !scheduled) ||
           (( !start   || start   <= today) &&
            ( !scheduled || scheduled <= today));
};

// Build map of children for every task
const childrenMap = new Map();
currentTasks.forEach(t => childrenMap.set(t._uniqueId, []));
currentTasks.forEach(t => {
	if (t._parentId && childrenMap.has(t._parentId)) {
		childrenMap.get(t._parentId).push(t);
	}
});

// OKR IDENTIFICATION ---------------------------------------------------------------------------------------
const isOKR = task => {
    if (!task.text.includes("🎯")) return false;
    const pattern = /<mark[^>]*><strong>🎯\s+.*?<\/strong><\/mark>/;
    
    // Check if the pattern appears at the beginning of the text or is only preceded by whitespace
    const leadingTextPattern = /^\s*<mark[^>]*><strong>🎯\s+/;
    return pattern.test(task.text) && leadingTextPattern.test(task.text);
};

// TASK TYPE HELPER ----------------------------------------------------------------------------------------
const getTaskType = task => {
    if (!task) return null;
    if (task.text.includes("🎖️")) return "initiative";
    if (task.text.includes("🏆")) return "epic";
    if (task.text.includes("📝")) return "story";
    if (isOKR(task))         return "okr";
    return "task";
};

// VIEWS ----------------------------------------------------------------------------------------------------
const projectView = (status = true) => {
    // Generic parent‐finding via _parentId
    function findParentById(task) {
        if (!task._parentId) return null;
        return taskMap.get(task._parentId) || null;
    }

    // NEW helper: climb entire ancestor chain until predicate matches
    function findAncestor(task, predicate) {
        let p = findParentById(task);
        while (p) {
            if (predicate(p)) return p;
            p = findParentById(p);
        }
        return null;
    }

    // Common type checks
    const isInitiative = t => t && t.text.includes("🎖️");
    const isEpic       = t => t && t.text.includes("🏆");
    const isStory      = t => t && t.text.includes("📝");
    const isTask       = t => t && !isInitiative(t) && !isEpic(t) && !isStory(t) && !isOKR(t);

    // Direct‐assignment filter
	const isDirectlyAssigned = task =>
	  activeForMember(task, status) &&
	  !task.completed &&
	  isRelevantToday(task) &&
	  !isCancelled(task);

    // Recursively build full subtree (used elsewhere)
    function buildFullSubtree(task) {
        return {
            ...task,
            children: (childrenMap.get(task._uniqueId) || []).map(buildFullSubtree)
        };
    }

    // Walk up to the topmost parent
    function getTopAncestor(task) {
        let cur = task, last = task;
        while (cur._parentId && taskMap.has(cur._parentId)) {
            last = taskMap.get(cur._parentId);
            cur = last;
        }
        return last;
    }

    // --- FULL OKR PROCESSING USING direct parent → child ---
    const assignedOKRs = currentTasks.filter(task =>
        isOKR(task) &&
        activeForMember(task, status) &&
        !task.completed &&
        !isCancelled(task) &&
        task.status !== "-" &&
        isRelevantToday(task)
    );
	const assignedOKRSet = new Set(assignedOKRs.map(t => t._uniqueId));
	
	function findLinkedOKRs(okrSet) {
	    // Array to store the linked OKR relationships
	    const linkedOKRs = [];
	    
	    // Convert assignedOKRSet to an array of task IDs
	    const assignedOKRIds = Array.from(okrSet);
	    
	    // For each assigned OKR
	    assignedOKRIds.forEach(okrId => {
	        const okrTask = taskMap.get(okrId);
	        if (!okrTask) {
	            return;
	        }
	        
	        // Check if the OKR text ends with a 6-digit code pattern
	        const codeMatch = okrTask.text.match(/\^([A-Za-z0-9]{6})$/);
	        if (!codeMatch) {
	            return;
	        }
	        
	        // Extract the 6-digit code
	        const sixDigitCode = codeMatch[1];
	        
	        // Find all tasks that contain the pattern code">🔗🎯 (without square brackets)
	        const linkedPattern = new RegExp(`${sixDigitCode}">🔗🎯`);
	        
	        // Search through all tasks for links to this OKR & modify parent
	        const linkedTasks = currentTasks
	            .filter(task => 
	                linkedPattern.test(task.text));
	        
	        // Add to our results
	        if (linkedTasks.length > 0) {
	            // Loop through linkedTasks to set parent and _parentId
	            for (let i = 0; i < linkedTasks.length; i++) {
	                linkedTasks[i].parent = okrTask.line;
	                linkedTasks[i]._parentId = okrTask._uniqueId;
	                linkedTasks[i].status = "!";
	            }
	            
	            linkedOKRs.push({
	                sourceOKR: okrTask,
	                linkedTasks: linkedTasks
	            });
	        }
	    });
	
	    console.log("Final linked OKRs:", linkedOKRs);
	    return linkedOKRs;
	}
	
	const linkedOKRs = findLinkedOKRs(assignedOKRSet);
	
	const okrRoots = Array.from(
	    new Set(assignedOKRs.map(getTopAncestor).map(t => t._uniqueId))
	).map(id => taskMap.get(id));
	
	function buildOKRSubtree(node, isOKRNode = false) {
	    // Get all children of the current node
	    const children = childrenMap.get(node._uniqueId) || [];
	    
	    // Check if this node is an assigned OKR
	    const isAssignedOKR = assignedOKRSet.has(node._uniqueId);
	
	    // If this is an assigned OKR, mark it for the recursive calls
	    if (isAssignedOKR) {
	        isOKRNode = true;
	    }
	
	    // Process children differently based on whether this is an OKR node
	    if (isOKRNode) {
	        // For OKR nodes or their descendants, include ALL children
	        let processedChildren = children.map(child => 
	            buildOKRSubtree(child, true)
	        );
	
	        // If this node is an assigned OKR, append linkedTasks (if any)
	        if (isAssignedOKR) {
	            // Find the linkedOKR entry for this node
	            const linkedEntry = linkedOKRs.find(entry => entry.sourceOKR._uniqueId === node._uniqueId);
	            if (linkedEntry && linkedEntry.linkedTasks.length > 0) {
	                // Add a blank separator task
	                const blankTask = {
	                    id: node.text + '-' + Date.now() + '-' + Math.random().toString(36).slice(2,7),
	                    symbol: "-",
	                    text: "‎🔗",
	                    children: [],
	                    task: false,
	                    annotated: false,
	                    subtasks: [],
	                    real: false,
	                    status: "O",
	                    checked: true,
	                    completed: false,
	                    fullyCompleted: false
	                };
	                
	                // Add the separator first, then the linked tasks
	                processedChildren.push(blankTask);
	                
	                // Then add the linked tasks
	                const linkedTaskNodes = linkedEntry.linkedTasks.map(task => ({ ...task, children: [] }));
	                processedChildren = processedChildren.concat(linkedTaskNodes);
	            }
	        }
	
	        // Return the node with all its children (including linked tasks)
	        return { ...node, children: processedChildren };
	    } else {
	        // For non-OKR nodes, only include children that lead to OKRs
	        const filteredChildren = children
	            .map(child => buildOKRSubtree(child, false))
	            .filter(child => child !== null);
	            
	        // Only include this node if it's an assigned OKR or has OKR descendants
	        if (isAssignedOKR || filteredChildren.length) {
	            return { ...node, children: filteredChildren };
	        }
	        return null;
	    }
	}
	
	const prunedOKRs = okrRoots
	    .map(root => buildOKRSubtree(root))
	    .filter(root => root !== null);

    // --- REMAINING SECTIONS STILL USING existing logic --- 
    function getPathToAncestor(task, ancestorId) {
        let path = [], cur = task, seen = new Set();
        while (cur && cur._uniqueId !== ancestorId && !seen.has(cur._uniqueId)) {
            seen.add(cur._uniqueId);
            path.push(cur);
            if (!cur._parentId) break;
            cur = taskMap.get(cur._parentId);
        }
        if (cur && cur._uniqueId === ancestorId) path.push(cur);
        return path.reverse();
    }
    function buildHierarchyFromPath(path) {
        if (!path.length) return null;
        let root = { ...path[0], children: [] }, cursor = root;
        for (let i = 1; i < path.length; i++) {
            const child = { ...path[i], children: [] };
            cursor.children = [child];
            cursor = child;
        }
        return root;
    }

    function processTaskHierarchy(task, assignedSet) {
        if (!task) return null;
        if (assignedSet.some(x => x._uniqueId === task._uniqueId)) {
            return { ...task, children: [] };
        }
        const kids = (childrenMap.get(task._uniqueId) || [])
            .map(t => processTaskHierarchy(t, assignedSet))
            .filter(Boolean);
        return kids.length ? { ...task, children: kids } : null;
    }

	function processTaskType(taskFilter, parentFinders) {
	    // 1. Filter tasks according to the provided predicate
	    const filtered = currentTasks.filter(taskFilter);
	
	    // 2. Group tasks by each parent‐finder label
	    const parentGroups = {};
	    parentFinders.forEach(({ finder, label, typeCheck }) => {
	        // Determine which labels come “before” this one
	        const prevLabels = parentFinders
	            .slice(0, parentFinders.findIndex(pf => pf.label === label))
	            .map(pf => pf.label);
	        // Exclude any task that already has a higher‐priority parent
	        const noPrev = filtered.filter(task =>
	            !prevLabels.some(pl =>
	                parentFinders.find(pf => pf.label === pl).finder(task)
	            )
	        );
	        // Find unique parent IDs of the desired type
	        const ofType = Array.from(new Set(
	            noPrev
	                .map(task => finder(task))
	                .filter(p => p && typeCheck(p))
	                .map(p => p._uniqueId)
	        ))
	        .map(id => taskMap.get(id))
	        .filter(Boolean);
	        parentGroups[label] = ofType;
	    });
	
	    // 3. Build a tree for each structured root (initiative, epic, story)
	    const trees = [];
	    parentFinders.forEach(({ label }) => {
	        (parentGroups[label] || []).forEach(root => {
	            const subtree = processTaskHierarchy(root, filtered);
	            if (subtree) trees.push(subtree);
	        });
	    });
	
	    // 4. Handle “non‐structured” tasks (no matching parentFinders)
	    const noStructured = filtered.filter(
	        t => !parentFinders.some(({ finder }) => finder(t))
	    );
	    const nonStructured = [];
	    noStructured.forEach(task => {
	        let cur = task, highest = null, seen = new Set();
	        // Climb ancestors until you hit a structured marker or cycle
	        while (cur && cur._parentId && !seen.has(cur._uniqueId)) {
	            seen.add(cur._uniqueId);
	            const p = taskMap.get(cur._parentId);
	            if (!p || [isInitiative, isEpic, isStory, isOKR].some(fn => fn(p))) break;
	            if (isAssignedToAnyUser(p)) highest = p;
	            cur = p;
	        }
	        if (highest) {
	            const path = getPathToAncestor(task, highest._uniqueId);
	            const h    = buildHierarchyFromPath(path);
	            if (h) nonStructured.push(h);
	        } else {
	            nonStructured.push({ ...task, children: [] });
	        }
	    });
	
	    // 5. MERGE all “nonStructured” subtrees that share the same root
	    const mergedRoots = {};
	    nonStructured.forEach(h => {
	        const rootId = h._uniqueId;
	        if (!mergedRoots[rootId]) {
	            // initialize with no children
	            mergedRoots[rootId] = { ...h, children: [] };
	        }
	        // accumulate each child under the same root
	        h.children.forEach(child => {
	            const existing = mergedRoots[rootId]
	                .children
	                .find(c => c._uniqueId === child._uniqueId);
	            if (existing) {
	                // merge grandchildren
	                existing.children.push(...child.children);
	            } else {
	                // first time seeing this child
	                mergedRoots[rootId].children.push({ ...child });
	            }
	        });
	    });
	    const uniqNS = Object.values(mergedRoots);
	
	    // 6. Return all structured trees plus merged non‐structured trees
	    return [...trees, ...uniqNS];
	}

    // ----- UPDATED parentFinders using full-ancestry -------
    const parentFinders = [
        { finder: t => findAncestor(t, isInitiative), label: "initiative", typeCheck: isInitiative },
        { finder: t => findAncestor(t, isEpic),       label: "epic",       typeCheck: isEpic },
        { finder: t => findAncestor(t, isStory),      label: "story",      typeCheck: isStory }
    ];

    // PROCESS OTHER SECTIONS
    const prunedTasks   = processTaskType(
         task => isDirectlyAssigned(task) &&
                 !isInitiative(task) &&
                 !isEpic(task) &&
                 !isStory(task) &&
                 !isOKR(task) &&
                 task.status !== "O" &&
                 task.status !== "d" &&
                 task.status !== "A",
         parentFinders
    );
    const prunedStories = processTaskType(
         task => isDirectlyAssigned(task) && getTaskType(task) === "story",
         parentFinders.slice(0,2)
    );
    const prunedEpics   = processTaskType(
         task => isDirectlyAssigned(task) && getTaskType(task) === "epic",
         parentFinders.slice(0,1)
    );

    // RESPONSIBILITIES ---------------------------------------------------------------------------------------
    const responsibilityRoots = currentTasks.filter(task =>
        task.status === "O" &&
        !task.completed &&
        isRelevantToday(task) &&
        !isCancelled(task) &&
        !task.text.includes("🎖️") &&
        !task.text.includes("🏆") &&
        !task.text.includes("📝")
    );
	function buildResponsibilityTree(task, isRoot = false) {
	    const allowedMarkers    = ["🚀","📦","⚡","⭐","💝","🔁","⬇️","🪣"];
	    const disallowedMarkers = ["❌","🛠️","📂","🏆","📝","🎖️"];
	
	    if (disallowedMarkers.some(m => task.text.includes(m))) return null;
	
	    const hasAllowedMarker = allowedMarkers.some(m => task.text.includes(m));
	    const hasAllowedStatus = (task.status === "d" || task.status === "A") && activeForMember(task, status);
	
	    // Only disallow "no marker" if NOT a root and not allowed by status+assignment
	    if (!isRoot && !hasAllowedMarker && !hasAllowedStatus) return null;
	
	    const rawChildren = Array.isArray(task.children) ? task.children : [];
	    const children = rawChildren
	      .map(child => buildResponsibilityTree(child, false))
	      .filter(c => c !== null);
	
	    if (task.task === false) {
	        return children.length > 0
	            ? { ...task, children }
	            : null;
	    }
	
	    const hasAllowed = hasAllowedMarker || hasAllowedStatus;
	    const assignedToMe = activeForMember(task, status);
	    if (!hasAllowed && children.length === 0 && !assignedToMe) {
	        return null;
	    }
	
	    return { ...task, children };
	}
    const rawTrees = responsibilityRoots
        .map(task => buildResponsibilityTree(task, true))
        .filter(tree => tree !== null);
    function pruneResponsibilities(node, inherited = false) {
      const m             = node.text.match(/active-([^"\s]+)/);
      const assignedToMe  = m?.[1] === teamMemberName;
      const isInherited   = inherited || assignedToMe;
      const children      = (node.children || [])
        .map(child => pruneResponsibilities(child, isInherited))
        .filter(Boolean);
      if (isInherited || children.length > 0) {
        return { ...node, children };
      }
      return null;
    }
    let responsibilityTasks = rawTrees
        .map(tree => pruneResponsibilities(tree))
        .filter(tree => tree !== null)
        .filter(tree => {
            const m    = tree.text.match(/active-([^"\s]+)/);
            const isMe = m?.[1] === teamMemberName;
            return isMe || (tree.children?.length > 0);
        });
    function stripFakeHeaders(nodes) {
      const out = [];
      for (const node of nodes) {
        if (node.task === false) {
          for (const child of node.children || []) {
            child._parentId = node._parentId;
            child.parent    = node.parent;
          }
          out.push(...stripFakeHeaders(node.children || []));
        }
        else {
          out.push({
            ...node,
            children: stripFakeHeaders(node.children || [])
          });
        }
      }
      return out;
    }
    responsibilityTasks = stripFakeHeaders(responsibilityTasks);

    // INITIATIVES --------------------------------------------------------------------------------------------
    const createHeader = text => ({
        id: text + '-' + Date.now() + '-' + Math.random().toString(36).slice(2,7),
        symbol: "-",
        text,
        children: [],
        task: false,
        annotated: false,
        subtasks: [],
        real: false,
        status: "O",
        checked: true,
        completed: false,
        fullyCompleted: false
    });
    const categorizeEpic = epic => {
        if (new RegExp(`class="(?:in)?active-(?!${teamMemberName})[^"]*"`).test(epic.text)) return "delegated";
        if (epic.text.includes(">⛔")) return "blocked";
        if (epic.text.includes(">⌛")) return "waiting";
        if (epic.text.includes(">🕒")) return "pending";
        if (epic.status === "/") return "inProgress";
        if (epic.status === " ") return "todo";
        return "other";
    };
    let ownInitiatives = currentTasks
      .filter(task => task.text && isInitiative(task))
      .map(initiative => {
          if (!childrenMap.get(initiative._uniqueId)) childrenMap.set(initiative._uniqueId, []);
          const epics = (childrenMap.get(initiative._uniqueId) || [])
            .filter(ep => isEpic(ep) && !ep.completed);
          const buckets = { inProgress:[], todo:[], blocked:[], waiting:[], pending:[], delegated:[], other:[] };
          epics.forEach(ep => {
              const cat = categorizeEpic(ep);
              buckets[cat].push({ ...ep, children: [] });
          });
          const nonEmpty = Object.values(buckets).filter(arr => arr.length).length;
          const sorted = [];
          ["inProgress","todo","blocked","waiting","pending","delegated","other"].forEach(cat => {
              if (!buckets[cat].length) return;
              if (nonEmpty > 1) sorted.push(createHeader("✏️"));
              if (cat === "todo") sorted.push(...buckets[cat].slice(0,3));
              else sorted.push(...buckets[cat]);
          });
          return { ...initiative, children: sorted };
      })
      .filter(task =>
          isInitiative(task) &&
          activeForMember(task, status) &&
          !task.completed &&
          isRelevantToday(task)
      );

    // RENDER -------------------------------------------------------------------------------------------------
    const renderSection = (title, tasks) => {
        if (tasks.length) {
            dv.el("h2", title);
            dv.taskList(tasks);
        }
    };

    renderSection("🎯 Objectives",    prunedOKRs);
    renderSection("🔨 Tasks",         prunedTasks);
    renderSection("📝 Stories",       prunedStories);
    renderSection("🏆 Epics",         prunedEpics);
    renderSection("🎖️ Initiatives",   ownInitiatives);
    renderSection("📂 Responsibilities", responsibilityTasks);
};

// INACTIVE / DEADLINE / COMPLETED VIEWS ------------------------------------------------------------------
const inactiveProjectView = () => projectView(false);

const deadlineView = (completed = false, taskList = currentTasks, header = "❗ Deadlines") => {
    const hasDeadline = task => {
        if (
            task.due ||
            task.scheduled ||
            /🎯\s*\d{4}-\d{2}-\d{2}/.test(task.text) ||
            isMarkedCompleted(task)
        ) return true;
        if (task.start) {
            if (task.due || task.scheduled) return true;
            const today = new Date(); today.setHours(0,0,0,0);
            const start = new Date(task.start); start.setHours(0,0,0,0);
            return task.status === " " || start >= today;
        }
        return false;
    };
    const isTaskAssignedToUser = (task, name) => {
        const m = task.text.match(/active-([^\s]+)/);
        return !m || m[1] === name;
    };
    const getEarliestDate = task => {
        const candidates = [];
        const nonStart = [];
        if (task.due) nonStart.push(task.due);
        if (task.scheduled) nonStart.push(task.scheduled);
        const m = task.text.match(/🎯\s*(\d{4}-\d{2}-\d{2})/);
        if (m) nonStart.push(m[1]);
        if (nonStart.length) candidates.push(...nonStart);
        else if (task.start) candidates.push(task.start);
        const dates = candidates.map(d => new Date(d)).filter(d => !isNaN(d));
        if (!dates.length) return new Date(8640000000000000);
        return dates.reduce((a,b) => a < b ? a : b);
    };
    const getCompletionDate = task => {
        const m = task.text.match(/✅\s(\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01]))/);
        return m ? new Date(m[1]) : null;
    };
    const collectDescendants = (task, name) => {
        let results = [];
        (childrenMap.get(task._uniqueId) || []).forEach(child => {
            if (isTaskAssignedToUser(child, name)) {
                if (hasDeadline(child)) {
                    results.push({ ...child, children: [], parent: null });
                }
                results.push(...collectDescendants(child, name));
            }
        });
        return results;
    };
    const initial = taskList.filter(task => activeForMember(task));
    let all = [];
    initial.forEach(task => {
        all.push({ ...task, children: [], parent: null });
        all.push(...collectDescendants(task, teamMemberName));
    });
    const filtered = all
        .filter(task => completed
            ? task.completed
            : !isCancelled(task) && !isMarkedCompleted(task) && hasDeadline(task)
        )
        .sort((a,b) => completed
            ? getCompletionDate(b) - getCompletionDate(a)
            : getEarliestDate(a) - getEarliestDate(b)
        );
    if (filtered.length) {
        dv.el("h2", header);
        dv.taskList(filtered, false);
    }
};

const completedView = () => deadlineView(true, currentTasks, "✅ Completed");

// DYNAMIC VIEW UPDATE -------------------------------------------------------------------------------------
const updateView = renderView => {
    const blockContainer = container.closest('.block-language-dataviewjs');
    const controlsContainer = blockContainer.querySelector('div[style*="display: flex; align-items: center;"]');
    blockContainer.querySelectorAll(':scope > *:not(:first-child)').forEach(e => e.remove());
    if (blockContainer.firstChild !== controlsContainer) {
        blockContainer.insertBefore(controlsContainer, blockContainer.firstChild);
    }
    renderView();
    setTimeout(() => {
        blockContainer.querySelectorAll('h4').forEach(h => h.remove());
        blockContainer.querySelectorAll('dataview-error-box').forEach(b => b.remove());
        blockContainer.querySelectorAll('.dataview.task-list-item-checkbox').forEach(cb => {
            if (cb instanceof HTMLInputElement) cb.disabled = true;
        });
    }, 0);
};

// UI CONTROLS ---------------------------------------------------------------------------------------------
const container = dv.el("div", "", { attr: { style: "display: flex; align-items: center; gap: 10px;" } });
const viewSelect = dv.el("select", "", { attr: { style: "margin-right: 10px;" } });
const viewOptions = [
    { name: "🚀 Projects", render: projectView },
    { name: "❗ Deadlines", render: deadlineView },
    { name: "✅ Completed", render: completedView }
];
viewSelect.innerHTML = viewOptions.map((opt,i) => `<option value="${i}">${opt.name}</option>`).join("");
const versionText = document.createElement('p');
const strongText = document.createElement('strong');
strongText.textContent = `Agile Obsidian  v${version}`;
versionText.appendChild(strongText);
const projectStatusSelect = document.createElement('select');
projectStatusSelect.innerHTML = `
    <option value="active">Active</option>
    <option value="inactive">Inactive</option>
`;
projectStatusSelect.style.display = viewSelect.selectedIndex === 0 ? 'inline-block' : 'none';
container.appendChild(versionText);
container.appendChild(viewSelect);
container.appendChild(projectStatusSelect);

viewSelect.addEventListener('change', () => {
    projectStatusSelect.style.display = viewSelect.selectedIndex === 0 ? 'inline-block' : 'none';
    updateView(viewOptions[viewSelect.selectedIndex].render);
});
projectStatusSelect.addEventListener('change', evt => {
    updateView(evt.target.value === "inactive" ? inactiveProjectView : projectView);
});

// INITIAL RENDER ------------------------------------------------------------------------------------------
updateView(viewOptions[viewSelect.selectedIndex].render);
```
