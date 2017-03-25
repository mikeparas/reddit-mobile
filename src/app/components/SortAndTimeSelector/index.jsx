import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';

import * as navigationActions from 'platform/actions';
import { METHODS } from 'platform/router';
import { listingTime } from 'lib/listingTime';

import SortSelector from 'app/components/SortSelector';
import { SORTS } from 'app/sortValues';

const T = React.PropTypes;

const SortAndTimeSelector = props => {
  const {
    className,
    sort,
    sortOptions,
    onSortChange,
    time,
    timeOptions,
    onTimeChange,
  } = props;

  return (
    <div className={ `SortAndTimeSelector ${className}` }>
      <SortSelector
        id='posts-sort-selector'
        title='Sort posts by:'
        sortValue={ sort }
        sortOptions={ sortOptions }
        onSortChange={ onSortChange }
      />
      { time &&
        <SortSelector
          id='posts-time-selector'
          sortValue={ time }
          sortOptions={ timeOptions }
          onSortChange={ onTimeChange }
        />
      }
    </div>
  );
};

SortAndTimeSelector.propTypes = {
  className: T.string,
  onSortChange: T.func.isRequired,
  onTimeChange: T.func.isRequired,
  sort: SortSelector.sortType.isRequired,
  sortOptions: SortSelector.sortOptionsType.isRequired,
  time: SortSelector.sortType, // isn't required because the current page might
  // not have a time filter active. We use the presence of this property
  // to indicate a time selector should be shown.
  timeOptions: SortSelector.sortOptionsType.isRequired,
};

SortAndTimeSelector.defaultProps = {
  className: '',

  sortOptions: [
    SORTS.HOT,
    SORTS.TOP,
    SORTS.NEW,
    SORTS.CONTROVERSIAL,
  ],

  timeOptions: [
    SORTS.ALL_TIME,
    SORTS.PAST_YEAR,
    SORTS.PAST_MONTH,
    SORTS.PAST_WEEK,
    SORTS.PAST_DAY,
    SORTS.PAST_HOUR,
  ],
};

const mapStateToProps = createSelector(
  state => state.platform.currentPage,
  currentPage => ({ currentPage }),
);

const mapDispatchToProps = dispatch => ({
  navigateToUrl(url, query) {
    dispatch(navigationActions.navigateToUrl(METHODS.GET, url, query));
  },
});

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const { currentPage: { url, urlParams, queryParams } } = stateProps;

  const sort = urlParams.sort || queryParams.sort || SORTS.HOT;
  const time = ownProps.time || listingTime(queryParams, sort);
  const { navigateToUrl } = dispatchProps;
  const { userName, commentsOrSubmitted } = urlParams;

  let onSortChange;

  if (userName) {
    onSortChange = sort =>
      navigateToUrl(`/user/${userName}/${commentsOrSubmitted}`, {
        queryParams: { ...queryParams, sort },
      });
  } else if (/\/search$/.test(url)) {
    onSortChange = sort => {
      // remove time filter if "hot" or "new"
      if (sort === SORTS.HOT || sort === SORTS.NEW) {
        delete queryParams.t;
      }
      navigateToUrl(url, {
        queryParams: { ...queryParams, sort },
      });
    };
  } else {
    onSortChange = sort => {
      const { subredditName } = urlParams;
      const baseUrl = subredditName ? `/r/${subredditName}` : '';
      navigateToUrl(`${baseUrl}/${sort}`);
    };
  }

  return {
    time,
    sort,
    ...ownProps,
    ...stateProps,
    onTimeChange: time => navigateToUrl(url, { queryParams: { ...queryParams, t: time } }),
    onSortChange,
  };
};

export default connect(mapStateToProps, mapDispatchToProps, mergeProps)(SortAndTimeSelector);
