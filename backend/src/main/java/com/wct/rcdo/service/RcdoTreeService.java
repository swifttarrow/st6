package com.wct.rcdo.service;

import com.wct.rcdo.dto.RcdoSearchResult;
import com.wct.rcdo.dto.RcdoTreeResponse;
import com.wct.rcdo.entity.DefiningObjective;
import com.wct.rcdo.entity.Outcome;
import com.wct.rcdo.entity.RallyCry;
import com.wct.rcdo.repository.DefiningObjectiveRepository;
import com.wct.rcdo.repository.OutcomeRepository;
import com.wct.rcdo.repository.RallyCryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class RcdoTreeService {

    private final RallyCryRepository rallyCryRepository;
    private final DefiningObjectiveRepository definingObjectiveRepository;
    private final OutcomeRepository outcomeRepository;

    public RcdoTreeService(RallyCryRepository rallyCryRepository,
                           DefiningObjectiveRepository definingObjectiveRepository,
                           OutcomeRepository outcomeRepository) {
        this.rallyCryRepository = rallyCryRepository;
        this.definingObjectiveRepository = definingObjectiveRepository;
        this.outcomeRepository = outcomeRepository;
    }

    public List<RcdoTreeResponse> getTree(boolean includeArchived) {
        List<RallyCry> rallyCries = includeArchived
                ? rallyCryRepository.findAllByOrderBySortOrder()
                : rallyCryRepository.findByArchivedAtIsNullOrderBySortOrder();
        List<DefiningObjective> definingObjectives = includeArchived
                ? definingObjectiveRepository.findAllByOrderBySortOrder()
                : definingObjectiveRepository.findByArchivedAtIsNullOrderBySortOrder();
        List<Outcome> outcomes = includeArchived
                ? outcomeRepository.findAllByOrderBySortOrder()
                : outcomeRepository.findByArchivedAtIsNullOrderBySortOrder();

        // Group outcomes by defining objective ID
        Map<UUID, List<Outcome>> outcomesByDoId = outcomes.stream()
                .collect(Collectors.groupingBy(Outcome::getDefiningObjectiveId));

        // Group defining objectives by rally cry ID
        Map<UUID, List<DefiningObjective>> dosByRcId = definingObjectives.stream()
                .collect(Collectors.groupingBy(DefiningObjective::getRallyCryId));

        return rallyCries.stream()
                .map(rc -> {
                    List<RcdoTreeResponse.DefiningObjectiveNode> doNodes =
                            dosByRcId.getOrDefault(rc.getId(), List.of()).stream()
                                    .map(doEntity -> {
                                        List<RcdoTreeResponse.OutcomeNode> outcomeNodes =
                                                outcomesByDoId.getOrDefault(doEntity.getId(), List.of()).stream()
                                                        .map(o -> new RcdoTreeResponse.OutcomeNode(
                                                                o.getId(), o.getName(), o.getDescription(),
                                                                o.getArchivedAt() != null))
                                                        .toList();
                                        return new RcdoTreeResponse.DefiningObjectiveNode(
                                                doEntity.getId(), doEntity.getName(),
                                                doEntity.getDescription(),
                                                doEntity.getArchivedAt() != null,
                                                outcomeNodes);
                                    })
                                    .toList();
                    return new RcdoTreeResponse(rc.getId(), rc.getName(),
                            rc.getDescription(),
                            rc.getArchivedAt() != null,
                            doNodes);
                })
                .toList();
    }

    public List<RcdoSearchResult> searchOutcomes(String query) {
        return outcomeRepository.searchByName(query);
    }
}
