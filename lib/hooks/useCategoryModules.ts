import { useMemo } from "react";
import { CATEGORIES, getCategoryModules, getCategorySystemPrompt, CategoryId } from "@/lib/categories/registry";
import { getModules, MODULE_GROUPS, ModuleDefinition } from "@/lib/modules/registry";

export interface GroupedModules {
  groupId: string;
  groupNameKey: string;
  modules: ModuleDefinition[];
}

export function useCategoryModules(categoryId: CategoryId | string) {
  return useMemo(() => {
    const catId = (Object.keys(CATEGORIES).includes(categoryId)
      ? categoryId
      : "general") as CategoryId;

    const moduleIds = getCategoryModules(catId);
    const modules = getModules(moduleIds);

    const grouped: GroupedModules[] = MODULE_GROUPS.map((group) => ({
      groupId: group.id,
      groupNameKey: group.nameKey,
      modules: modules.filter((m) => m.group === group.id),
    })).filter((g) => g.modules.length > 0);

    return {
      modules,
      grouped,
      systemPrompt: getCategorySystemPrompt(catId),
      categoryId: catId,
    };
  }, [categoryId]);
}
