package com.wct.rcdo.service;

import com.wct.rcdo.dto.CreateRallyCryRequest;
import com.wct.rcdo.dto.RallyCryResponse;
import com.wct.rcdo.dto.UpdateRallyCryRequest;
import com.wct.rcdo.entity.DefiningObjective;
import com.wct.rcdo.entity.Outcome;
import com.wct.rcdo.entity.RallyCry;
import com.wct.rcdo.repository.DefiningObjectiveRepository;
import com.wct.rcdo.repository.OutcomeRepository;
import com.wct.rcdo.repository.RallyCryRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class RallyCryService {

    private final RallyCryRepository repository;
    private final DefiningObjectiveRepository definingObjectiveRepository;
    private final OutcomeRepository outcomeRepository;
    private final OutcomeService outcomeService;

    public RallyCryService(RallyCryRepository repository,
                           DefiningObjectiveRepository definingObjectiveRepository,
                           OutcomeRepository outcomeRepository,
                           OutcomeService outcomeService) {
        this.repository = repository;
        this.definingObjectiveRepository = definingObjectiveRepository;
        this.outcomeRepository = outcomeRepository;
        this.outcomeService = outcomeService;
    }

    public RallyCryResponse create(CreateRallyCryRequest request) {
        validateName(request.name());
        RallyCry entity = new RallyCry();
        entity.setName(request.name());
        entity.setDescription(request.description());
        entity.setSortOrder(0);
        entity = repository.save(entity);
        return toResponse(entity);
    }

    public List<RallyCryResponse> findAll(boolean includeArchived) {
        List<RallyCry> entities = includeArchived
                ? repository.findAllByOrderBySortOrder()
                : repository.findByArchivedAtIsNullOrderBySortOrder();
        return entities.stream().map(this::toResponse).toList();
    }

    public RallyCryResponse findById(UUID id) {
        return toResponse(findEntityById(id));
    }

    public RallyCryResponse update(UUID id, UpdateRallyCryRequest request) {
        validateName(request.name());
        RallyCry entity = findEntityById(id);
        entity.setName(request.name());
        entity.setDescription(request.description());
        entity.setSortOrder(request.sortOrder());
        entity = repository.save(entity);
        return toResponse(entity);
    }

    public RallyCryResponse archive(UUID id) {
        RallyCry entity = findEntityById(id);
        List<UUID> doIds = definingObjectiveRepository.findByRallyCryIdOrderBySortOrder(id)
                .stream().map(DefiningObjective::getId).toList();
        List<UUID> outcomeIds = new ArrayList<>();
        for (UUID doId : doIds) {
            outcomeRepository.findByDefiningObjectiveIdOrderBySortOrder(doId)
                    .stream().map(Outcome::getId).forEach(outcomeIds::add);
        }
        outcomeService.checkActiveCommitments(outcomeIds);
        entity.setArchivedAt(OffsetDateTime.now());
        entity = repository.save(entity);
        return toResponse(entity);
    }

    public RallyCryResponse unarchive(UUID id) {
        RallyCry entity = findEntityById(id);
        entity.setArchivedAt(null);
        entity = repository.save(entity);
        return toResponse(entity);
    }

    private RallyCry findEntityById(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Rally Cry not found"));
    }

    private void validateName(String name) {
        if (name == null || name.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name must not be blank");
        }
    }

    private RallyCryResponse toResponse(RallyCry entity) {
        return new RallyCryResponse(
                entity.getId(),
                entity.getName(),
                entity.getDescription(),
                entity.getSortOrder(),
                entity.getArchivedAt(),
                entity.getCreatedAt(),
                entity.getUpdatedAt());
    }
}
