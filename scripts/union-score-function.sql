-- ============================================
-- ФУНКЦИЯ ДЛЯ РАСЧЁТА SCORE СОЮЗА
-- Суммирует total_earned всех участников союза
-- ============================================

-- Функция для получения score союза
CREATE OR REPLACE FUNCTION get_union_score(union_id BIGINT)
RETURNS BIGINT AS $$
DECLARE
  total_score BIGINT := 0;
BEGIN
  SELECT COALESCE(SUM(p.total_earned), 0)
  INTO total_score
  FROM union_members um
  JOIN players p ON p.id = um.user_id
  WHERE um.union_id = get_union_score.union_id;

  RETURN total_score;
END;
$$ LANGUAGE plpgsql;

-- Представление для получения союзов с актуальным score
CREATE OR REPLACE VIEW unions_with_score AS
SELECT 
  u.id,
  u.name,
  u.code,
  u.members,
  u.description,
  u.logo_emoji,
  u.logo_color,
  u.logo_shape,
  u.created_at,
  u.owner_id,
  COALESCE(SUM(p.total_earned), 0) AS score
FROM unions u
LEFT JOIN union_members um ON um.union_id = u.id
LEFT JOIN players p ON p.id = um.user_id
GROUP BY u.id;

-- Функция для обновления score всех союзов (вызывать периодически)
CREATE OR REPLACE FUNCTION update_all_union_scores()
RETURNS void AS $$
BEGIN
  UPDATE unions u
  SET score = (
    SELECT COALESCE(SUM(p.total_earned), 0)
    FROM union_members um
    JOIN players p ON p.id = um.user_id
    WHERE um.union_id = u.id
  );
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического обновления score при изменении игроков
CREATE OR REPLACE FUNCTION update_union_score_on_player_change()
RETURNS TRIGGER AS $$
DECLARE
  affected_unions BIGINT[];
  u_id BIGINT;
BEGIN
  -- Получаем ID союзов, в которых состоит игрок
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    SELECT ARRAY_AGG(union_id)
    INTO affected_unions
    FROM union_members
    WHERE user_id = NEW.id;
    
    -- Обновляем score для каждого союза
    FOREACH u_id IN ARRAY affected_unions
    LOOP
      UPDATE unions
      SET score = (
        SELECT COALESCE(SUM(p.total_earned), 0)
        FROM union_members um
        JOIN players p ON p.id = um.user_id
        WHERE um.union_id = u_id
      )
      WHERE id = u_id;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Удаляем старый триггер если есть
DROP TRIGGER IF EXISTS trigger_update_union_score ON players;

-- Создаём триггер
CREATE TRIGGER trigger_update_union_score
AFTER INSERT OR UPDATE OF total_earned ON players
FOR EACH ROW
EXECUTE FUNCTION update_union_score_on_player_change();

-- Обновляем score всех существующих союзов
SELECT update_all_union_scores();
