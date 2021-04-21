import {useInfiniteQuery} from "react-query";

export function UseInfiniteQuery (props) {
    return props.children(useInfiniteQuery(props.keyf, props.fn, props.options))
}

export function UseFetchBulkQuotesQuery (props) {
    return props.children(props.api.api.useFetchBulkQuotesQuery(props.symbols, props.options, props.queryKey)());
}

export function UseQuoteSummaryQuery (props) {
    return props.children(props.api.api.useQuoteSummaryQuery(props.symbol)());
}

