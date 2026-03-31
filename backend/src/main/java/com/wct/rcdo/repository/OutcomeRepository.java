package com.wct.rcdo.repository;

import com.wct.rcdo.dto.RcdoSearchResult;
import com.wct.rcdo.entity.Outcome;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OutcomeRepository extends JpaRepository<Outcome, UUID> {

    List<Outcome> findByDefiningObjectiveIdAndArchivedAtIsNullOrderBySortOrder(UUID definingObjectiveId);

    List<Outcome> findByDefiningObjectiveIdOrderBySortOrder(UUID definingObjectiveId);

    List<Outcome> findByArchivedAtIsNullOrderBySortOrder();

    @Query("SELECT new com.wct.rcdo.dto.RcdoSearchResult(o.id, o.name, d.id, d.name, rc.id, rc.name) " +
           "FROM Outcome o JOIN DefiningObjective d ON o.definingObjectiveId = d.id " +
           "JOIN RallyCry rc ON d.rallyCryId = rc.id " +
           "WHERE LOWER(o.name) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "AND o.archivedAt IS NULL AND d.archivedAt IS NULL AND rc.archivedAt IS NULL " +
           "ORDER BY rc.sortOrder, d.sortOrder, o.sortOrder")
    List<RcdoSearchResult> searchByName(@Param("query") String query);
}
