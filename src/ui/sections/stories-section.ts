import { App } from "obsidian";
import { TaskItem, TaskParams } from "src/domain/tasks/task-item";
import { renderTaskTree } from "../components/task-renderer";
import {
	activeForMember,
	isCancelled,
	isInProgress,
	isMarkedCompleted,
	isSleeping,
} from "src/domain/tasks/task-filters";
import { isStory } from "src/domain/tasks/task-types";
import { buildPrunedMergedTrees } from "src/domain/hierarchy/hierarchy-utils";

export function processAndRenderStories(
	container: HTMLElement,
	currentTasks: TaskItem[],
	status: boolean,
	selectedAlias: string | null,
	app: App,
	taskMap: Map<string, TaskItem>,
	childrenMap: Map<string, TaskItem[]>,
	taskParams: TaskParams
) {
	// Filter for task params
	const { inProgress, completed, sleeping, cancelled } = taskParams;
	const sectionTasks = currentTasks.filter((task) => {
		return (
			(inProgress && isInProgress(task, taskMap)) ||
			(completed && isMarkedCompleted(task)) ||
			(sleeping && isSleeping(task, taskMap)) ||
			(cancelled && isCancelled(task))
		);
	});

	// Filter for any task directly assigned to the user
	const directlyAssigned = sectionTasks.filter(
		(task) => activeForMember(task, status, selectedAlias) && isStory(task)
	);

	// Build pruned merged trees from the filtered tasks
	const prunedTasks = buildPrunedMergedTrees(directlyAssigned, taskMap);

	// Render if there are tasks
	if (prunedTasks.length > 0) {
		container.createEl("h2", { text: "📝 Stories" });
		renderTaskTree(prunedTasks, container, app, 0, false, "tasks");
	}
}
