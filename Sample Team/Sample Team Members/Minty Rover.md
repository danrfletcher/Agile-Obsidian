---
cssclasses:
  - full-width-edit
  - full-width-preview
"obsidianUIMode:": preview
---
## ✏️ Notes
- [t] Minty, regarding the onboarding email campaign, what's our timeline for finalizing the email templates and integrating them with the email service provider? <sub><mark style="background: linear-gradient(to right, #dd3e54, #6be585);"><strong>📨 John Doe 2025-06-08 19:06</strong></mark></sub>
- [t] Minty, can you provide a detailed breakdown of the resources needed for the UX review of the new signup UI mockups, and how we can ensure it aligns with the overall project goals? <sub><mark style="background: linear-gradient(to right, #dd3e54, #6be585);"><strong>📨 John Doe 2025-06-08 19:06</strong></mark></sub>
- [t] Minty, what specific metrics will we use to measure the success of the Customer Onboarding Revamp, and how frequently will we review these metrics to ensure we're on track? <sub><mark style="background: linear-gradient(to right, #dd3e54, #6be585);"><strong>📨 Joe Bloggs  2025-06-08 19:06</strong></mark></sub>
___
```dataviewjs
const version = "2.6.0";
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

function stripFakeHeaders(nodes) {
  const out = [];
  for (const node of nodes) {
    const isNowHeader = node.task === false && /🚀\s*\*\*Now\*\*/.test(node.text);
    
    if (isNowHeader) {
	  // Allow "Now" headers only
      for (const child of node.children || []) {
        child._parentId = node._parentId;
        child.parent    = node.parent;
      }
      out.push(...stripFakeHeaders(node.children || []));
    }
    else {
      // Disallow all other headers nodes (including other fake headers)
      out.push({
        ...node,
        children: stripFakeHeaders(node.children || [])
      });
    }
  }
  return out;
}

// Process tasks and assign unique IDs
let currentTasks = [];
folderPages.forEach(page => {
    const tasks = stripFakeHeaders(page.file.tasks ? page.file.tasks.values : []);
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
const hasTargetDate = task => { 
	if (!task || typeof task.text !== "string") return false; 
	const match = task.text.match(/🎯\s*(\d{4}-\d{2}-\d{2})/); 
	return match ? match[1] : false; 
};

const getEarliestDate = task => {
	const candidates = [];
	const nonStart = [];
	if (task.due) nonStart.push(task.due);
	if (task.scheduled) nonStart.push(task.scheduled);
	const m = hasTargetDate(task);
	if (m) nonStart.push(m);
	if (nonStart.length) candidates.push(...nonStart);
	else if (task.start) candidates.push(task.start);
	const dates = candidates.map(d => new Date(d)).filter(d => !isNaN(d));
	if (!dates.length) return new Date(8640000000000000);
	return dates.reduce((a,b) => a < b ? a : b);
};

// Check if task is snoozed for the member
const isSleeping = task => {
  if (!task || typeof task.text !== "string") return false;

  // Find all snooze instances (unchanged)
  const sleepMatches = [...task.text.matchAll(/💤\s*(?:<span[^>]*style="display:\s*none"[^>]*>([^<]*)<\/span>)?\s*(\d{4}-\d{2}-\d{2})?/g)];
  if (!sleepMatches.length) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if there's a global snooze (no member name specified)
  const globalSnooze = sleepMatches.find(match => !match[1]);
  if (globalSnooze) {
    if (!globalSnooze[2]) return true; // Global snooze with no date (indefinite, as before)
    
    const target = new Date(globalSnooze[2]);
    if (isNaN(target)) return false;
    target.setHours(0, 0, 0, 0);
    if (target > today) return true; // Global snooze still active
    
    return false; // Unsnooze after expiration date
  }

  // No global snooze, check for current team member's snooze (unchanged, as it seems correct)
  const memberSnooze = sleepMatches.find(match => 
    match[1] === teamMemberName
  );
  
  if (!memberSnooze) return false; // Current member not in snooze list

  // Current member has a snooze entry
  if (!memberSnooze[2]) return true; // Member snooze with no date (indefinite)

  const target = new Date(memberSnooze[2]);
  if (isNaN(target)) return false;
  target.setHours(0, 0, 0, 0);
  return target > today; // Snoozed only if date is future
};

// Build map of children for every task
const childrenMap = new Map();
currentTasks.forEach(t => childrenMap.set(t._uniqueId, []));
currentTasks.forEach(t => {
	if (t._parentId && childrenMap.has(t._parentId)) {
		childrenMap.get(t._parentId).push(t);
	}
});

const deepClone = obj =>
	typeof structuredClone === "function"
		? structuredClone(obj)
		: JSON.parse(JSON.stringify(obj));

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
	    const linkedOKRs = [];
	    const assignedOKRIds = Array.from(okrSet);
	
	    assignedOKRIds.forEach(okrId => {
	        const okrTask = taskMap.get(okrId);
	        if (!okrTask) return;
	
	        // OKR must end with a ^XXXXXX code (unchanged)
	        const codeMatch = okrTask.text.match(/\^([A-Za-z0-9]{6})$/);
	        if (!codeMatch) return;
	
	        const sixDigitCode = codeMatch[1];
	        const linkedPattern = new RegExp(`${sixDigitCode}">🔗🎯`);
	
	        // Grab raw linked tasks (unchanged)
	        const rawLinked = currentTasks.filter(t => linkedPattern.test(t.text));
	        if (!rawLinked.length) return;
	
	        // NEW: Group linked tasks by their unique top ancestor (root) to handle duplicates/overlaps
	        const rootsMap = new Map(); // Key: root _uniqueId, Value: array of linked tasks under that root
	        rawLinked.forEach(linkedTask => {
	            const root = getTopAncestor(linkedTask); // Walk up to top ancestor (using existing function)
	            if (!root) return;
	            if (!rootsMap.has(root._uniqueId)) {
	                rootsMap.set(root._uniqueId, []);
	            }
	            rootsMap.get(root._uniqueId).push(linkedTask);
	        });
	
	        // NEW: For each unique root, clone the full subtree, prune it, and mark linked tasks with 'P'
	        const clonedLinkedTrees = [];
	        rootsMap.forEach((linkedTasksInRoot, rootId) => {
	            const originalRoot = taskMap.get(rootId);
	            const clonedRoot = deepClone(buildFullSubtree(originalRoot)); // Clone full subtree (using existing function)
	
	            // Prune the cloned tree to only include paths to linked tasks (similar to processTaskHierarchy)
	            function pruneToLinked(node) {
	                if (!node) return null;
	
	                // Recursively prune children
	                const prunedChildren = (node.children || [])
	                    .map(child => pruneToLinked(child))
	                    .filter(Boolean);
	
	                // Check if this node is a linked task (set 'P' here)
	                const isLinked = linkedTasksInRoot.some(lt => lt._uniqueId === node._uniqueId);
	                if (isLinked) {
	                    node.status = "p"; // Set 'P' on actual linked tasks (per your request)
	                }
	
	                // Include this node if it's linked or has linked descendants
	                if (isLinked || prunedChildren.length > 0) {
	                    // Update parent relationships in the cloned tree for coherence
	                    prunedChildren.forEach(child => {
	                        child.parent = node.line; // Align parent to cloned node
	                        child._parentId = node._uniqueId;
	                    });
	                    return { ...node, children: prunedChildren };
	                }
	                return null;
	            }
	
	            const prunedClonedRoot = pruneToLinked(clonedRoot);
	            if (prunedClonedRoot) {
	                clonedLinkedTrees.push(prunedClonedRoot);
	            }
	        });
	
	        if (clonedLinkedTrees.length > 0) {
	            linkedOKRs.push({
	                sourceOKR: okrTask,
	                linkedTrees: clonedLinkedTrees // NEW: Return cloned/pruned trees instead of flat tasks
	            });
	        }
	    });
	
	    return linkedOKRs;
	}
	
	const linkedOKRs = findLinkedOKRs(assignedOKRSet);
	
	const okrRoots = Array.from(
	    new Set(assignedOKRs.map(getTopAncestor).map(t => t._uniqueId))
	).map(id => taskMap.get(id));
	
	function buildOKRSubtree(node, isOKRNode = false) {
	    // Get all children of the current node (unchanged)
	    const children = childrenMap.get(node._uniqueId) || [];
	    
	    // Check if this node is an assigned OKR (unchanged)
	    const isAssignedOKR = assignedOKRSet.has(node._uniqueId);
	
	    // If this is an assigned OKR, mark it for the recursive calls (unchanged)
	    if (isAssignedOKR) {
	        isOKRNode = true;
	    }
	
	    // Process children differently based on whether this is an OKR node (unchanged)
	    if (isOKRNode) {
	        // For OKR nodes or their descendants, include ALL children (unchanged)
	        let processedChildren = children.map(child => 
	            buildOKRSubtree(child, true)
	        );
	
	        // If this node is an assigned OKR, append linkedTrees (if any) – MODIFIED to use trees
	        if (isAssignedOKR) {
	            // Find the linkedOKR entry for this node (unchanged)
	            const linkedEntry = linkedOKRs.find(entry => entry.sourceOKR._uniqueId === node._uniqueId);
	            if (linkedEntry && linkedEntry.linkedTrees?.length > 0) { // Changed from linkedTasks to linkedTrees
	                // Add a blank separator task (unchanged)
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
	                
	                // Add the separator first, then the linked trees (NEW: attach full pruned trees)
	                processedChildren.push(blankTask);
	                linkedEntry.linkedTrees.forEach(tree => {
	                    // Set parent relationship on the cloned root for rendering coherence
	                    tree.parent = node.line;
	                    tree._parentId = node._uniqueId;
	                });
	                processedChildren = processedChildren.concat(linkedEntry.linkedTrees);
	            }
	        }
	
	        // Return the node with all its children (including linked trees) – unchanged
	        return { ...node, children: processedChildren };
	    } else {
	        // For non-OKR nodes, only include children that lead to OKRs (unchanged)
	        const filteredChildren = children
	            .map(child => buildOKRSubtree(child, false))
	            .filter(child => child !== null);
	            
	        // Only include this node if it's an assigned OKR or has OKR descendants (unchanged)
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
                 !isSleeping(task) &&
                 task.status !== "O" &&
                 task.status !== "d" &&
                 task.status !== "A",
         parentFinders
    );
    const prunedStories = processTaskType(
         task => isDirectlyAssigned(task) &&
	         !isSleeping(task) &&
	         getTaskType(task) === "story",
         parentFinders.slice(0,2)
    );
    const prunedEpics   = processTaskType(
         task => isDirectlyAssigned(task) && 
	         !isSleeping(task) &&
	         getTaskType(task) === "epic",
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
	    const hasAllowedStatus = (task.status === "d" || task.status === "A");
	
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
      .filter(task => task.text && isInitiative(task) && !isSleeping(task))
      .map(initiative => {
          if (!childrenMap.get(initiative._uniqueId)) childrenMap.set(initiative._uniqueId, []);
          const epics = (childrenMap.get(initiative._uniqueId) || [])
            .filter(ep => isEpic(ep) && !ep.completed && !isCancelled(ep));
          const buckets = { inProgress:[], todo:[], blocked:[], waiting:[], pending:[], delegated:[], other:[] };
          epics
	          .filter(ep => !isSleeping(ep))
	          .forEach(ep => {
	              const cat = categorizeEpic(ep);
	              buckets[cat].push({ ...ep, children: [] });
          });
          const nonEmpty = Object.values(buckets).filter(arr => arr.length).length;
          const sorted = [];
          ["inProgress","todo","blocked","waiting","pending","delegated","other"].forEach(cat => {
              if (!buckets[cat].length) return;
              if (nonEmpty > 1 && cat !== "todo") sorted.push(createHeader("✏️"));
              if (cat !== "todo") sorted.push(...buckets[cat]);
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
            hasTargetDate(task) ||
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

