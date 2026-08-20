"use client";

// Exact structural port of platform-fe's components/common/custom-table.tsx
// — sorting, controlled/uncontrolled pagination, draggable rows, expandable
// rows, mobile card view and the sticky virtualized-height scroll mode are
// all unchanged from the source. TypeScript generics/types stripped.
//
// The one intentional swap: platform-fe's per-page control is its own
// CustomSelect (which pulls in Radix Popover + a shadcn Input — a second,
// unrelated component tree just for a 3-option dropdown); replaced here
// with this app's own lightweight Select (components/ui/Select.jsx, no
// Radix Popover dependency), wired to the exact same changePerPage/
// perPageOptions/currentPerPage values. Everything else — Button, the
// column-config API, sort/pagination/drag/expand logic — is byte-for-byte
// the same as the source file.
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { IconCaretUpFilled, IconCaretDownFilled, IconChevronDown, IconGripVertical } from "@tabler/icons-react";

import { Button } from "@/components/components/ui/button";
import { cn } from "@/components/lib/utils";
import Select from "@/components/ui/Select";
import TableSkeleton from "./TableSkeleton";

function moveItem(items, from, to) {
  const nextItems = [...items];
  const [removed] = nextItems.splice(from, 1);
  nextItems.splice(to, 0, removed);
  return nextItems;
}

export default function CustomTable({
  columns,
  data,
  loading = false,
  emptyMessage = "No records found",
  rowKey = "id",
  defaultShowRows,
  tableLayout = "auto",
  tableClassName,

  pagination = true,
  defaultPerPage = 10,
  perPageOptions = [10, 20, 50],
  paginationState,
  onPageChange,
  onPerPageChange,

  onRowClick,
  skeletonHasActions = true,
  isStripedRows = false,
  mobileCardRender,
  mobileLoadingCardCount = 10,
  mobileCardsClassName = "space-y-2",
  cardViewBreakpoint = "xl",
  draggableRows = false,
  onRowsReorder,
  onRowsReorderEnd,
  dragColumnClassName,
  dragHandleAriaLabel,

  expandable = false,
  canExpandRow,
  renderExpandedContent,
  renderExpandedRows,
  defaultExpandedRowKeys = [],
  expandedRowKeys,
  onExpandedRowKeysChange,
  expandOnRowClick = false,
  expandColumnClassName,
  expandedContentCellClassName,
  expandToggleAriaLabel,
}) {
  const minimumRowsForPagination = 10;
  const defaultTableHeaderHeight = 49;
  const defaultTableRowHeight = 49;
  const [sortKey, setSortKey] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");
  const headerRowRef = useRef(null);
  const firstBodyRowRef = useRef(null);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(defaultPerPage);
  const [draggedRowKey, setDraggedRowKey] = useState(null);
  const [dragOverRowKey, setDragOverRowKey] = useState(null);
  const [internalExpandedRowKeys, setInternalExpandedRowKeys] = useState(defaultExpandedRowKeys);
  const [measuredHeaderHeight, setMeasuredHeaderHeight] = useState(defaultTableHeaderHeight);
  const [measuredRowHeight, setMeasuredRowHeight] = useState(defaultTableRowHeight);
  const showMobileCards = Boolean(mobileCardRender);
  const tableVisibleClass = showMobileCards
    ? { md: "hidden md:block", lg: "hidden lg:block", xl: "hidden xl:block" }[cardViewBreakpoint]
    : "";
  const desktopPaginationClass = showMobileCards
    ? { md: "hidden md:flex", lg: "hidden lg:flex", xl: "hidden xl:flex" }[cardViewBreakpoint]
    : "flex";
  const mobilePaginationClass = showMobileCards
    ? { md: "flex md:hidden", lg: "flex lg:hidden", xl: "flex xl:hidden" }[cardViewBreakpoint]
    : "";
  const isControlledPagination = Boolean(paginationState);
  const isControlledExpandedRows = Array.isArray(expandedRowKeys);
  const currentPage = paginationState?.page ?? page;
  const currentPerPage = paginationState?.perPage ?? perPage;
  const currentExpandedRowKeys = expandedRowKeys ?? internalExpandedRowKeys;
  const expandedRowKeySet = useMemo(() => new Set(currentExpandedRowKeys), [currentExpandedRowKeys]);
  const latestRowsRef = useRef(data);
  const hasExpandableRows = expandable && Boolean(renderExpandedContent || renderExpandedRows);
  const visibleRows = typeof defaultShowRows === "number" && defaultShowRows > 0 ? Math.floor(defaultShowRows) : null;
  const scrollContainerHeight = visibleRows ? `${measuredHeaderHeight + visibleRows * measuredRowHeight}px` : undefined;

  // Sorting
  const sortedData = useMemo(() => {
    if (!sortKey) return data;

    const column = columns.find((col) => String(col.key) === sortKey);

    if (!column) return data;

    return [...data].sort((a, b) => {
      const first = column.sortValue ? column.sortValue(a) : a[sortKey];

      const second = column.sortValue ? column.sortValue(b) : b[sortKey];

      if (first == null) return 1;
      if (second == null) return -1;

      const firstValue = first instanceof Date ? first.getTime() : first;

      const secondValue = second instanceof Date ? second.getTime() : second;

      if (firstValue < secondValue) {
        return sortDirection === "asc" ? -1 : 1;
      }

      if (firstValue > secondValue) {
        return sortDirection === "asc" ? 1 : -1;
      }

      return 0;
    });
  }, [columns, data, sortDirection, sortKey]);

  // Pagination
  const totalPages = Math.max(1, paginationState?.totalPages ?? Math.ceil(sortedData.length / currentPerPage));

  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;
    if (isControlledPagination) return sortedData;

    const start = (currentPage - 1) * currentPerPage;
    const end = start + currentPerPage;

    return sortedData.slice(start, end);
  }, [currentPage, currentPerPage, isControlledPagination, sortedData, pagination]);

  const handleSort = (column) => {
    if (!column.sortable) return;

    const key = String(column.key);

    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const getTextAlignmentClass = (alignment = "left") => {
    if (alignment === "center") return "text-center";
    if (alignment === "right") return "text-right";

    return "text-left";
  };

  const getHeaderContentAlignmentClass = (alignment = "left") => {
    if (alignment === "center") return "justify-center";
    if (alignment === "right") return "justify-end";

    return "justify-start";
  };

  const getRowKey = (row, index) => {
    if (typeof rowKey === "function") {
      return rowKey(row, index);
    }

    return row[rowKey] ?? index;
  };

  latestRowsRef.current = data;

  const setExpandedRows = (nextKeys) => {
    if (!isControlledExpandedRows) {
      setInternalExpandedRowKeys(nextKeys);
    }

    onExpandedRowKeysChange?.(nextKeys);
  };

  const isRowExpandable = (row, index) => {
    if (!hasExpandableRows) return false;

    return canExpandRow ? canExpandRow(row, index) : true;
  };

  const toggleExpandedRow = (row, index) => {
    const key = getRowKey(row, index);
    const nextKeys = expandedRowKeySet.has(key)
      ? currentExpandedRowKeys.filter((expandedKey) => expandedKey !== key)
      : [...currentExpandedRowKeys, key];

    setExpandedRows(nextKeys);
  };

  const reorderRows = (fromKey, toKey) => {
    const currentRows = latestRowsRef.current;
    const fromIndex = currentRows.findIndex((row, index) => getRowKey(row, index) === fromKey);
    const toIndex = currentRows.findIndex((row, index) => getRowKey(row, index) === toKey);

    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;

    const nextRows = moveItem(currentRows, fromIndex, toIndex);
    latestRowsRef.current = nextRows;
    onRowsReorder?.(nextRows);
  };

  useEffect(() => {
    if (!visibleRows) return;

    const measureRows = () => {
      const nextHeaderHeight = Math.ceil(headerRowRef.current?.getBoundingClientRect().height || defaultTableHeaderHeight);
      const nextRowHeight = Math.ceil(firstBodyRowRef.current?.getBoundingClientRect().height || defaultTableRowHeight);

      setMeasuredHeaderHeight((previous) => (previous === nextHeaderHeight ? previous : nextHeaderHeight));
      setMeasuredRowHeight((previous) => (previous === nextRowHeight ? previous : nextRowHeight));
    };

    measureRows();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measureRows);

      return () => {
        window.removeEventListener("resize", measureRows);
      };
    }

    const resizeObserver = new ResizeObserver(() => {
      measureRows();
    });

    if (headerRowRef.current) {
      resizeObserver.observe(headerRowRef.current);
    }

    if (firstBodyRowRef.current) {
      resizeObserver.observe(firstBodyRowRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [loading, paginatedData, visibleRows]);

  const changePage = (nextPage) => {
    if (isControlledPagination) {
      onPageChange?.(nextPage);
      return;
    }

    setPage(nextPage);
  };

  const changePerPage = (nextPerPage) => {
    if (isControlledPagination) {
      onPerPageChange?.(nextPerPage);
      return;
    }

    setPerPage(nextPerPage);
    setPage(1);
  };

  const tableClasses = visibleRows
    ? `small-scrollbar [scrollbar-width:thin]
  [&::-webkit-scrollbar]:w-1.5
  [&::-webkit-scrollbar-thumb]:rounded-full
  [&::-webkit-scrollbar-thumb]:bg-slate-300
  [&::-webkit-scrollbar-thumb:hover]:bg-slate-400
  [&::-webkit-scrollbar-track]:bg-transparent overflow-auto`
    : "overflow-x-auto";

  // Swapped from platform-fe's CustomSelect (Radix Popover + shadcn Input)
  // to this app's own lightweight Select (components/ui/Select.jsx, no
  // Radix Popover dependency) — see file header. Same currentPerPage/
  // changePerPage wiring either way.
  const desktopPagination = (
    <div className={`${desktopPaginationClass} items-center justify-between px-4 py-3`}>
      <Button variant="secondary" size="sm" disabled={currentPage === 1} onClick={() => changePage(currentPage - 1)}>
        Previous
      </Button>

      <div className="flex items-center gap-4">
        <span className="text-sm text-fg-primary">
          Page {currentPage} of {totalPages}
        </span>

        <Select
          className="w-[140px]"
          value={String(currentPerPage)}
          onChange={(v) => changePerPage(Number(v))}
          options={perPageOptions.map((option) => ({ value: String(option), label: `${option} per page` }))}
        />
      </div>

      <Button variant="secondary" size="sm" disabled={currentPage === totalPages} onClick={() => changePage(currentPage + 1)}>
        Next
      </Button>
    </div>
  );

  const mobilePagination = showMobileCards ? (
    <div className={`${mobilePaginationClass} items-center justify-between gap-3 py-3`}>
      <Button
        variant="secondary"
        size="sm"
        className="h-8 rounded-[10px] px-3 text-[12px]"
        disabled={currentPage === 1}
        onClick={() => changePage(Math.max(1, currentPage - 1))}
      >
        Previous
      </Button>

      <span className="text-[13px] font-medium text-fg-primary">
        {currentPage} of {totalPages}
      </span>

      <Button
        variant="secondary"
        size="sm"
        className="h-8 rounded-[10px] px-3 text-[12px]"
        disabled={currentPage === totalPages}
        onClick={() => changePage(Math.min(totalPages, currentPage + 1))}
      >
        Next
      </Button>
    </div>
  ) : null;

  const shouldShowPagination =
    pagination && !loading && (sortedData.length > minimumRowsForPagination || (isControlledPagination && totalPages > 1));

  return (
    <div
      className={
        showMobileCards
          ? "overflow-visible border-0 bg-transparent xl:overflow-hidden xl:rounded-xl xl:border xl:border-border-secondary xl:bg-bg-primary"
          : "overflow-hidden rounded-xl border border-border-secondary bg-bg-primary"
      }
    >
      <div className={tableVisibleClass}>
        <div className={tableClasses} style={scrollContainerHeight ? { maxHeight: scrollContainerHeight } : undefined}>
          <table className={cn("w-full text-sm", tableLayout === "fixed" && "table-fixed", tableClassName)}>
            <thead>
              <tr ref={headerRowRef} className="border-b border-border-secondary bg-[#FAFAFA]">
                {draggableRows && (
                  <th
                    className={cn("w-12 px-4 py-3", visibleRows && "sticky top-0 z-10 bg-[#f1f1f1]", dragColumnClassName)}
                    aria-hidden="true"
                  />
                )}

                {hasExpandableRows && (
                  <th
                    className={cn("w-12 px-4 py-3", visibleRows && "sticky top-0 z-10 bg-[#f1f1f1]", expandColumnClassName)}
                    aria-hidden="true"
                  />
                )}

                {columns.map((column) => {
                  const active = sortKey === String(column.key);

                  return (
                    <th
                      key={String(column.key)}
                      onClick={() => handleSort(column)}
                      className={cn(
                        "px-4 py-3 text-xs font-semibold text-fg-secondary",
                        getTextAlignmentClass(column.headerAlign ?? column.align),
                        column.sortable && "cursor-pointer select-none",
                        visibleRows && "sticky top-0 z-10 bg-[#f1f1f1]",
                        column.headerClassName
                      )}
                    >
                      <div className={cn("flex items-center gap-1", getHeaderContentAlignmentClass(column.headerAlign ?? column.align))}>
                        {column.title}

                        {column.sortable &&
                          (active ? (
                            sortDirection === "asc" ? (
                              <IconCaretUpFilled size={14} className="text-brand-600" />
                            ) : (
                              <IconCaretDownFilled size={14} className="text-brand-600" />
                            )
                          ) : (
                            <div className="flex flex-col leading-none">
                              <IconCaretUpFilled size={10} className="opacity-30" />

                              <IconCaretDownFilled size={10} className="-mt-1 opacity-30" />
                            </div>
                          ))}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <TableSkeleton
                  columns={columns.length + (hasExpandableRows ? 1 : 0) + (draggableRows ? 1 : 0)}
                  rows={visibleRows ?? currentPerPage}
                  hasActionColumn={skeletonHasActions}
                />
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (hasExpandableRows ? 1 : 0) + (draggableRows ? 1 : 0)}
                    className="py-10 text-center text-fg-quaternary"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, index) => {
                  const key = getRowKey(row, index);
                  const rowIsExpandable = isRowExpandable(row, index);
                  const isExpanded = rowIsExpandable && expandedRowKeySet.has(key);

                  return (
                    <Fragment key={key}>
                      <tr
                        ref={index === 0 ? firstBodyRowRef : null}
                        onDragOver={(event) => {
                          if (!draggableRows || draggedRowKey === null) return;
                          event.preventDefault();
                          if (dragOverRowKey !== key) {
                            setDragOverRowKey(key);
                          }

                          if (draggedRowKey !== key) {
                            reorderRows(draggedRowKey, key);
                          }
                        }}
                        onDragLeave={() => {
                          if (!draggableRows || dragOverRowKey !== key) return;
                          setDragOverRowKey(null);
                        }}
                        onDrop={(event) => {
                          if (!draggableRows || draggedRowKey === null) return;
                          event.preventDefault();
                          setDraggedRowKey(null);
                          setDragOverRowKey(null);
                          onRowsReorderEnd?.(latestRowsRef.current);
                        }}
                        onClick={() => {
                          if (expandOnRowClick && rowIsExpandable) {
                            toggleExpandedRow(row, index);
                          }

                          onRowClick?.(row);
                        }}
                        className={`border-b border-border-secondary transition-all duration-150 ${
                          draggedRowKey === key ? "opacity-50" : "opacity-100"
                        } ${dragOverRowKey === key ? "bg-bg-secondary" : "hover:bg-bg-secondary"} ${
                          isStripedRows ? "odd:bg-bg-primary even:bg-[#FAFAFA]" : ""
                        } ${onRowClick || (expandOnRowClick && rowIsExpandable) ? "cursor-pointer" : ""}`}
                      >
                        {draggableRows && (
                          <td className={cn("w-12 px-4 py-3 align-middle", dragColumnClassName)}>
                            <button
                              type="button"
                              draggable
                              className="flex h-6 w-6 cursor-grab items-center justify-center rounded-full text-fg-secondary hover:bg-bg-secondary active:cursor-grabbing"
                              onClick={(event) => event.stopPropagation()}
                              onDragStart={(event) => {
                                event.stopPropagation();
                                setDraggedRowKey(key);
                                setDragOverRowKey(null);
                              }}
                              onDragEnd={() => {
                                setDraggedRowKey(null);
                                setDragOverRowKey(null);
                                onRowsReorderEnd?.(latestRowsRef.current);
                              }}
                              aria-label={dragHandleAriaLabel?.(row, index) ?? "Reorder row"}
                            >
                              <IconGripVertical size={16} />
                            </button>
                          </td>
                        )}

                        {hasExpandableRows && (
                          <td className={cn("w-12 px-4 py-3 align-middle", expandColumnClassName)}>
                            {rowIsExpandable ? (
                              <button
                                type="button"
                                className="flex h-6 w-6 items-center justify-center rounded-full text-fg-secondary transition-transform hover:bg-bg-secondary"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  toggleExpandedRow(row, index);
                                }}
                                aria-label={expandToggleAriaLabel?.(row, isExpanded) ?? (isExpanded ? "Collapse row" : "Expand row")}
                              >
                                <IconChevronDown size={16} className={cn("transition-transform", isExpanded ? "rotate-0" : "-rotate-90")} />
                              </button>
                            ) : (
                              <span className="block h-6 w-6" aria-hidden="true" />
                            )}
                          </td>
                        )}

                        {columns.map((column) => (
                          <td key={String(column.key)} className={cn("px-4 py-3", getTextAlignmentClass(column.align), column.className)}>
                            {column.render ? column.render(row, index) : row[column.key]}
                          </td>
                        ))}
                      </tr>

                      {rowIsExpandable && isExpanded
                        ? (renderExpandedRows?.(row, index) ?? (
                            <tr className="border-b border-border-secondary bg-bg-primary">
                              <td
                                colSpan={columns.length + (hasExpandableRows ? 1 : 0) + (draggableRows ? 1 : 0)}
                                className={cn("p-0", expandedContentCellClassName)}
                              >
                                {renderExpandedContent?.(row, index)}
                              </td>
                            </tr>
                          ))
                        : null}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showMobileCards && (
        <div className={`${{ md: "md:hidden", lg: "lg:hidden", xl: "xl:hidden" }[cardViewBreakpoint]} ${mobileCardsClassName}`}>
          {loading ? (
            Array.from({ length: mobileLoadingCardCount }).map((_, index) => (
              <div key={index} className="h-[78px] animate-pulse rounded-[12px] border border-[#e5e5e5] bg-white" />
            ))
          ) : paginatedData.length === 0 ? (
            <div className="rounded-[12px] border border-border-secondary bg-bg-primary px-4 py-10 text-center text-fg-quaternary">
              {emptyMessage}
            </div>
          ) : (
            paginatedData.map((row, index) => <div key={getRowKey(row, index)}>{mobileCardRender?.(row, index)}</div>)
          )}
        </div>
      )}

      {shouldShowPagination && (
        <>
          {desktopPagination}
          {mobilePagination}
        </>
      )}
    </div>
  );
}
