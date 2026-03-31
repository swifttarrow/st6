package com.wct.rcdo.repository;

import com.wct.rcdo.entity.RallyCry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RallyCryRepository extends JpaRepository<RallyCry, UUID> {

    List<RallyCry> findByArchivedAtIsNullOrderBySortOrder();

    List<RallyCry> findAllByOrderBySortOrder();
}
