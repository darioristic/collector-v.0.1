import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  parseAsArrayOf,
} from "nuqs/server";

export const searchParamsCache = createSearchParamsCache({
  q: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(0),
  sort: parseAsArrayOf(parseAsString).withDefault(["createdAt", "desc"]),
  start: parseAsString,
  end: parseAsString,
  statuses: parseAsArrayOf(
    parseAsStringEnum(["draft", "pending", "overdue", "paid", "canceled"])
  ),
  customers: parseAsArrayOf(parseAsString),
});
