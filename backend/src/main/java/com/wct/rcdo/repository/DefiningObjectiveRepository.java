package com.wct.rcdo.repository;

import com.wct.rcdo.entity.DefiningObjective;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DefiningObjectiveRepository extends JpaRepository<DefiningObjective, UUID> {

    List<DefiningObjective> findByRallyCryIdAndArchivedAtIsNullOrderBySortOrder(UUID rallyCryId);

    List<DefiningObjective> findByRallyCryIdInAndArchivedAtIsNullOrderByRallyCryIdAscSortOrderAsc(List<UUID> rallyCryIds);

    List<DefiningObjective> findByRallyCryIdOrderBySortOrder(UUID rallyCryId);

    List<DefiningObjective> findByArchivedAtIsNullOrderBySortOrder();

    List<DefiningObjective> findAllByOrderBySortOrder();
}
